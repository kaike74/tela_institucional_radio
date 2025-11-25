/**
 * Dashboard Institucional - Cloudflare Worker
 * Busca dados da API Audiency e coordenadas via Geonames
 */

export default {
    async fetch(request, env, ctx) {
        console.log("=== DASHBOARD WORKER - VERSÃO COMPLETA ===");

        // Configurações
        const API_KEY = "9620cf74-856d-40c2-a091-248e4f322caa";
        const GEONAMES_USERNAME = "kaike";

        try {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dataHoje = hoje.toISOString().split('T')[0];

            const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            const fimMesAtual = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

            console.log(`📅 Processando: ${dataHoje}`);

            // ===== 1. BUSCAR CAMPANHAS DO MÊS =====
            let campanhasDoMes = [];
            let pagina = 1;

            while (pagina <= 3) { // Limitar a 3 páginas para evitar timeout
                const url = `https://api.audiency.io/advertiser-rest/campaigns?page=${pagina}&limit=1000&orderBy=name-asc&month=${mes}&year=${ano}`;

                const response = await fetch(url, {
                    headers: { "accept": "application/json", "apiKey": API_KEY }
                });

                if (!response.ok) break;

                const data = await response.json();
                const registros = data.data?.lines || [];

                campanhasDoMes = campanhasDoMes.concat(registros);

                if (registros.length < 1000) break;
                pagina++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            console.log(`📊 Campanhas do mês: ${campanhasDoMes.length}`);

            // ===== 2. FILTRAR CAMPANHAS VÁLIDAS =====
            const campanhasValidas = campanhasDoMes.filter(c => {
                const inicio = new Date(c.startDate);
                const fim = new Date(c.endDate);
                return fim >= inicioMesAtual && inicio <= fimMesAtual;
            });

            console.log(`🎯 Campanhas válidas: ${campanhasValidas.length}`);

            // ===== 3. BUSCAR INSERÇÕES DE HOJE =====
            let insercoesHoje = [];
            let emissorasSet = new Set();
            let cidadesSet = new Set();

            // Processar primeiras 10 campanhas para evitar timeout
            const campanhasParaProcessar = campanhasValidas.slice(0, 10);

            for (const campanha of campanhasParaProcessar) {
                try {
                    const execUrl = `https://api.audiency.io/advertiser-rest/reports/common/advertiser-execution?page=1&limit=1000&countryId=1&campaignId=${campanha.id}&stationDate=${dataHoje}&stationDate=${dataHoje}`;

                    const execResponse = await fetch(execUrl, {
                        headers: { "accept": "application/json", "apiKey": API_KEY }
                    });

                    if (execResponse.ok) {
                        const execData = await execResponse.json();
                        const items = execData?.data?.lines || [];

                        items.forEach(item => {
                            insercoesHoje.push({
                                stationName: item.stationName || '',
                                client: item.client || '',
                                hour: item.hour || '',
                                city: item.city ? item.city.split(' / ')[0] : '',
                                uf: item.city ? item.city.split(' / ')[1] : '',
                                date: item.date || ''
                            });

                            if (item.stationName) emissorasSet.add(item.stationName);
                            if (item.city) cidadesSet.add(item.city.split(' / ')[0]);
                        });
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.log(`Erro campanha ${campanha.id}: ${error.message}`);
                }
            }

            console.log(`🔥 Inserções encontradas: ${insercoesHoje.length}`);

            // ===== 4. BUSCAR COORDENADAS VIA GEONAMES =====
            const coordenadasCache = {};
            const cidadesArray = Array.from(cidadesSet);

            for (const cidade of cidadesArray.slice(0, 50)) { // Limitar a 50 cidades
                try {
                    const geonamesUrl = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(cidade)}&country=BR&maxRows=1&username=${GEONAMES_USERNAME}`;

                    const geoResponse = await fetch(geonamesUrl);

                    if (geoResponse.ok) {
                        const geoData = await geoResponse.json();

                        if (geoData.geonames && geoData.geonames.length > 0) {
                            const result = geoData.geonames[0];
                            coordenadasCache[cidade] = {
                                lat: parseFloat(result.lat),
                                lng: parseFloat(result.lng)
                            };
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit Geonames
                } catch (error) {
                    console.log(`Erro coordenadas ${cidade}: ${error.message}`);
                }
            }

            console.log(`📍 Coordenadas obtidas: ${Object.keys(coordenadasCache).length}`);

            // ===== 5. MONTAR ARRAY DE COORDENADAS =====
            const coordenadas = Object.entries(coordenadasCache).map(([cidade, coords]) => ({
                cidade,
                lat: coords.lat,
                lng: coords.lng
            }));

            // ===== 6. ORDENAR INSERÇÕES POR HORÁRIO =====
            insercoesHoje.sort((a, b) => {
                const horaA = a.hour || '00:00';
                const horaB = b.hour || '00:00';
                return horaB.localeCompare(horaA); // Mais recente primeiro
            });

            // ===== 7. PROJEÇÃO DE INSERÇÕES =====
            const fatorProjecao = campanhasValidas.length / campanhasParaProcessar.length;
            const insercoesProjetadas = Math.round(insercoesHoje.length * fatorProjecao);

            // ===== 8. RESULTADO FINAL =====
            const resultado = {
                success: true,
                timestamp: new Date().toISOString(),

                metricas: {
                    campanhasDoMes: campanhasDoMes.length,
                    campanhasAtivasHoje: campanhasValidas.length,
                    emissorasAtivasHoje: emissorasSet.size,
                    insercoesHoje: insercoesProjetadas,
                    cidadesAtivasHoje: cidadesSet.size
                },

                coordenadas: coordenadas,

                insercoesRecentes: insercoesHoje.slice(0, 50), // Últimas 50

                debug: {
                    campanhasProcessadas: campanhasParaProcessar.length,
                    insercoesReaisContadas: insercoesHoje.length,
                    fatorProjecao: fatorProjecao,
                    coordenadasObtidas: coordenadas.length
                }
            };

            console.log(`✅ Resposta montada com sucesso`);

            return new Response(JSON.stringify(resultado, null, 2), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=60"
                }
            });

        } catch (error) {
            console.error("❌ ERRO:", error);

            return new Response(JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }
    }
};
