document.addEventListener("DOMContentLoaded", function (event) {
    relatorio.event.init();
});

var relatorio = {};

var GRAFICO = undefined;

var PEDIDOS = [
    {

    }
]

relatorio.event = {

    init: () => {

        app.method.validaToken();
        app.method.carregarDadosEmpresa();

        // incia a primeira tab
        relatorio.method.openTab('faturamento');

        // Bloqueia os inputs de FILTROS por DATA (Faturamento)
        relatorio.method.bloquearDatasFiltrosFaturamento();

        // Bloqueia os inputs de FILTROS por DATA (Histórico)
        relatorio.method.bloquearDatasFiltrosHistorico();

    }

}

relatorio.method = {

    // método para carregar as tabs
    openTab: (tab) => {

        Array.from(document.querySelectorAll(".tab-content")).forEach(e => e.classList.remove('active'));
        Array.from(document.querySelectorAll(".tab-item")).forEach(e => e.classList.add('hidden'));

        document.querySelector("#tab-" + tab).classList.add('active');
        document.querySelector("#" + tab).classList.remove('hidden');

        switch (tab) {
            case 'faturamento':
                relatorio.method.carregarDataAtualFiltroFaturamento();
                relatorio.method.filtrarFaturamento();
                break;

            case 'historico':
                relatorio.method.carregarDataAtualFiltroHistorico();
                relatorio.method.filtrarHistorico();
                break;

            default:
                break;
        }

    },

    // bloquea o limite das datas pro filtro
    bloquearDatasFiltrosFaturamento: () => {

        // a data inicial poderá ser seleciona até 1 ANO atrás
        var umAnoAtras = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        let diaIni = umAnoAtras.getDate();
        let mesIni = umAnoAtras.getMonth() + 1;
        let anoIni = umAnoAtras.getFullYear();

        if (diaIni < 10) diaIni = '0' + diaIni;
        if (mesIni < 10) mesIni = '0' + mesIni;

        // seta o input com a data minima de 1 ano atras
        $("#txtDataInicioFaturamento").attr('min', `${anoIni}-${mesIni}-${diaIni}`);
        $("#txtDataFimFaturamento").attr('min', `${anoIni}-${mesIni}-${diaIni}`);

        // a data de seleção final pode ser somente até o último dia do mes atual
        var lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        let diaFim = lastDay.getDate();
        let mesFim = lastDay.getMonth() + 1;
        let anoFim = lastDay.getFullYear();

        if (diaFim < 10) diaFim = '0' + diaFim;
        if (mesFim < 10) mesFim = '0' + mesFim;

        // seta o input com a data máxima do último dia do mes atual
        $("#txtDataInicioFaturamento").attr('max', `${anoFim}-${mesFim}-${diaFim}`);
        $("#txtDataFimFaturamento").attr('max', `${anoFim}-${mesFim}-${diaFim}`);

    },

    // carrega a data atual para o filtro do relatório
    carregarDataAtualFiltroFaturamento: () => {

        // Carrega o MÊS atual no filtro
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let diaIni = firstDay.getDate();
        let mesIni = firstDay.getMonth() + 1;
        let anoIni = firstDay.getFullYear();

        let diaFim = lastDay.getDate();
        let mesFim = lastDay.getMonth() + 1;
        let anoFim = lastDay.getFullYear();

        if (diaIni < 10) diaIni = '0' + diaIni;
        if (mesIni < 10) mesIni = '0' + mesIni;

        if (diaFim < 10) diaFim = '0' + diaFim;
        if (mesFim < 10) mesFim = '0' + mesFim;

        $("#txtDataInicioFaturamento").val(`${anoIni}-${mesIni}-${diaIni}`);
        $("#txtDataFimFaturamento").val(`${anoFim}-${mesFim}-${diaFim}`);
        $("#ddlCategoriaFaturamento").val(0);

    },

    // filtra os faturamentos de acordo com o filtro
    filtrarFaturamento: () => {

        let datainicio = $("#txtDataInicioFaturamento").val();
        let datafim = $("#txtDataFimFaturamento").val();
        let categoria = $("#ddlCategoriaFaturamento").val();

        if (datainicio == '') {
            app.method.mensagem("Informe uma data de início válida, por favor.");
            return;
        }

        if (datafim == '') {
            app.method.mensagem("Informe uma data fim válida, por favor.");
            return;
        }

        let dados = {
            datainicio: datainicio,
            datafim: datafim,
            categoria: categoria
        }

        app.method.loading(true);

        app.method.post('/faturamento/filtrar', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                relatorio.method.carregarGrafico(response.data);
                relatorio.method.atualizarTotais(response.data);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // carrega o gráfico
    carregarGrafico: (lista) => {

        $("#lblNenhumFaturamento").addClass('hidden');

        if (GRAFICO != undefined) {
            GRAFICO.destroy();
            GRAFICO = undefined;
        }

        if (lista.length > 0) {

            // percorre a lista para montar o objeto do gráfico
            var LINHAS = [];
            var VALORES = [];

            // primeiro, verifica quantos dias tem de diferença entre as datas
            let datainicio = $("#txtDataInicioFaturamento").val();
            let datafim = $("#txtDataFimFaturamento").val()

            let data1 = new Date(`${datainicio} 00:00:00`);
            let data2 = new Date(`${datafim} 23:59:59`);

            // calcula a diferenca em tempo
            let diff_time = data2.getTime() - data1.getTime();

            // calcula a diferenca em dias
            let diff_days = Math.round(diff_time / (1000 * 3600 * 24));

            //console.log('diff_days', diff_days)

            for (let index = 0; index < diff_days; index++) {

                let data_teste = new Date(data1);
                data_teste.setDate(data_teste.getDate() + index);

                let dia = data_teste.getDate();
                let mes = data_teste.getMonth() + 1;
                let ano = data_teste.getFullYear();

                if (dia < 10) dia = '0' + dia;
                if (mes < 10) mes = '0' + mes;

                let data_final = `${dia}/${mes}/${ano}`;

                //console.log('data_final', data_final);

                // valida se tem registros pra essa data
                let existe = lista.filter((e) => {
                    let filtro = e.filtro.split('T')[0];
                    let dataFormatada = `${filtro.split('-')[2]}/${filtro.split('-')[1]}/${filtro.split('-')[0]}`;
                    return dataFormatada == data_final;
                })

                if (existe.length > 0) {
                    LINHAS.push(data_final);
                    VALORES.push(existe[0].total);
                }
                else {
                    // seta um valor zerado
                    LINHAS.push(data_final);
                    VALORES.push(0);
                }

            }

            console.log('LINHAS', LINHAS);
            console.log('VALORES', VALORES);

            const ctx = document.getElementById('graficoFaturamento').getContext("2d");

            GRAFICO = new Chart(ctx, {
                type: "line",
                data: {
                    labels: LINHAS,
                    datasets: [
                        {
                            label: "Faturamento",
                            data: VALORES,
                            borderWidth: 6,
                            fill: true,
                            backgroundColor: '#fffdf7',
                            borderColor: '#ffbf00',
                            pointBackgroundColor: '#ffbf00',
                            pointRadius: 5,
                            pointHoverRadius: 5,
                            pointHitDetectionRadius: 35,
                            pointBorderWidth: 2.5,
                        },
                    ],
                },
                options: {
                    legend: {
                        display: false
                    },
                    tooltips: {
                        // Disable the on-canvas tooltip
                        enabled: false,

                        custom: function (tooltipModel) {
                            // Tooltip Element
                            var tooltipEl = document.getElementById('chartjs-tooltip');

                            // Create element on first render
                            if (!tooltipEl) {
                                tooltipEl = document.createElement('div');
                                tooltipEl.id = 'chartjs-tooltip';
                                tooltipEl.innerHTML = '<table></table>';
                                document.body.appendChild(tooltipEl);
                            }

                            // Hide if no tooltip
                            if (tooltipModel.opacity === 0) {
                                tooltipEl.style.opacity = 0;
                                return;
                            }

                            // Set caret Position
                            tooltipEl.classList.remove('above', 'below', 'no-transform');
                            if (tooltipModel.yAlign) {
                                tooltipEl.classList.add(tooltipModel.yAlign);
                            } else {
                                tooltipEl.classList.add('no-transform');
                            }

                            function getBody(bodyItem) {
                                return bodyItem.lines;
                            }

                            // Set Text
                            if (tooltipModel.body) {
                                var titleLines = tooltipModel.title || [];
                                var bodyLines = tooltipModel.body.map(getBody);

                                var innerHtml = '<thead>';

                                titleLines.forEach(function (title) {
                                    innerHtml += '<tr><th>' + title + '</th></tr>';
                                });
                                innerHtml += '</thead><tbody>';

                                bodyLines.forEach(function (body, i) {

                                    //console.log('body', body)

                                    let valor = body[0].split(':')[1].trim();
                                    let texto = body[0].split(':')[0].trim();

                                    let formatado = texto + ': <b>R$ ' + (parseFloat(valor).toFixed(2)).toString().replace('.', ',') + '</b>';

                                    innerHtml += '<tr><td>' + formatado + '</td></tr>';
                                    innerHtml += '<tr><td>Nº Pedidos: ' + '<b>' + 5 + '</b>' + '</td></tr>';
                                });
                                innerHtml += '</tbody>';

                                var tableRoot = tooltipEl.querySelector('table');
                                tableRoot.innerHTML = innerHtml;
                            }

                            // `this` will be the overall tooltip
                            var position = this._chart.canvas.getBoundingClientRect();

                            // Display, position, and set styles for font
                            tooltipEl.style.opacity = 1;
                            tooltipEl.style.position = 'absolute';
                            tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX - (130) + 'px';
                            tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                            tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
                            tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
                            tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
                            tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
                            tooltipEl.style.pointerEvents = 'none';
                        }
                    },
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    beginAtZero: false,
                                    fontColor: '#999999',
                                    fontSize: 10,
                                    callback: (value, index, values) => {
                                        if (parseInt(value) >= 1000) {
                                            return 'R$ ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                                        } else {
                                            return 'R$ ' + value;
                                        }
                                    }
                                },
                                gridLines: {
                                    display: false,
                                    drawBorder: false
                                }
                            },
                        ],
                        xAxes: [
                            {
                                ticks: {
                                    fontColor: '#999999',
                                    fontSize: 10
                                },
                                gridLines: {
                                    display: false,
                                    drawBorder: false
                                }
                            }
                        ]
                    },
                },
            });

        }
        else {

            // nenhum registro encontrado
            $("#lblNenhumFaturamento").removeClass('hidden');

        }

    },

    // atualiza os cards de totais
    atualizarTotais: (lista) => {

        if (lista.length > 0) {

            let totalFaturado = 0;
            let totalPedidos = 0;

            $.each(lista, (i, e) => {
                totalFaturado += e.total;
                totalPedidos += e.pedidos;
            })

            let ticketMedio = parseFloat(totalFaturado / totalPedidos).toFixed(2);

            $("#lblTotalFaturamento").text(`R$ ${(totalFaturado.toFixed(2)).toString().replace('.', ',')}`);
            $("#lblTotalPedidos").text(totalPedidos);
            $("#lblTicketMedio").text(`R$ ${(ticketMedio).toString().replace('.', ',')}`);

        }
        else {

            // nenhum registro encontrado
            $("#lblTotalFaturamento").text('-');
            $("#lblTotalPedidos").text('-');
            $("#lblTicketMedio").text('-');

        }

    },


    // ---------- HISTÓRICO DE PEDIDOS --------------

    // bloquea o limite das datas pro filtro
    bloquearDatasFiltrosHistorico: () => {

        // a data inicial poderá ser seleciona até 1 ANO atrás
        var umAnoAtras = new Date(new Date().setFullYear(new Date().getFullYear() - 1));

        let diaIni = umAnoAtras.getDate();
        let mesIni = umAnoAtras.getMonth() + 1;
        let anoIni = umAnoAtras.getFullYear();

        if (diaIni < 10) diaIni = '0' + diaIni;
        if (mesIni < 10) mesIni = '0' + mesIni;

        // seta o input com a data minima de 1 ano atras
        $("#txtDataInicioHistorico").attr('min', `${anoIni}-${mesIni}-${diaIni}`);
        $("#txtDataFimHistorico").attr('min', `${anoIni}-${mesIni}-${diaIni}`);

        // a data de seleção final pode ser somente até HOJE
        let diaFim = new Date().getDate();
        let mesFim = new Date().getMonth() + 1;
        let anoFim = new Date().getFullYear();

        if (diaFim < 10) diaFim = '0' + diaFim;
        if (mesFim < 10) mesFim = '0' + mesFim;

        // seta o input com a data máxima de HOJE
        $("#txtDataInicioHistorico").attr('max', `${anoFim}-${mesFim}-${diaFim}`);
        $("#txtDataFimHistorico").attr('max', `${anoFim}-${mesFim}-${diaFim}`);

    },

    // carrega a data atual para o filtro do histócio
    carregarDataAtualFiltroHistorico: () => {

        // Carrega o MÊS atual no filtro
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date();

        let diaIni = firstDay.getDate();
        let mesIni = firstDay.getMonth() + 1;
        let anoIni = firstDay.getFullYear();

        let diaFim = lastDay.getDate();
        let mesFim = lastDay.getMonth() + 1;
        let anoFim = lastDay.getFullYear();

        if (diaIni < 10) diaIni = '0' + diaIni;
        if (mesIni < 10) mesIni = '0' + mesIni;

        if (diaFim < 10) diaFim = '0' + diaFim;
        if (mesFim < 10) mesFim = '0' + mesFim;

        $("#txtDataInicioHistorico").val(`${anoIni}-${mesIni}-${diaIni}`);
        $("#txtDataFimHistorico").val(`${anoFim}-${mesFim}-${diaFim}`); // Somente até HOJE

    },

    // filtra o historico de pedidos de acordo com o filtro
    filtrarHistorico: () => {

        let datainicio = $("#txtDataInicioHistorico").val();
        let datafim = $("#txtDataFimHistorico").val();

        if (datainicio == '') {
            app.method.mensagem("Informe uma data de início válida, por favor.");
            return;
        }

        if (datafim == '') {
            app.method.mensagem("Informe uma data fim válida, por favor.");
            return;
        }

        let dados = {
            datainicio: datainicio,
            datafim: datafim,
        }

        app.method.loading(true);

        app.method.post('/pedido/historico', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                relatorio.method.listarPedidos(response.data);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // carrega a tabela de pedidos
    listarPedidos: (list) => {

        $(".table-responsive").html('');

        if (list.length > 0) {
            
            $(".table-responsive").append(relatorio.template.tablePedido);

            let valor_total = 0;

            $.each(list, (i, e) => {

                // formata o status
                let status = '';

                if (e.idpedidostatus == 1) {
                    status = `<i class="far fa-dot-circle"></i> ${e.pedidostatus}`;
                }
                else if (e.idpedidostatus == 2) {
                    status = `<i class="far fa-thumbs-up"></i> ${e.pedidostatus}`;
                }
                else if (e.idpedidostatus == 3) {
                    status = `<i class="far fa-clock"></i> ${e.pedidostatus}`;
                }
                else if (e.idpedidostatus == 4) {
                    status = `<i class="fas fa-motorcycle"></i> ${e.pedidostatus}`;
                }
                else if (e.idpedidostatus == 5) {
                    status = `<i class="far fa-check-circle"></i> ${e.pedidostatus}`;
                }
                else if (e.idpedidostatus == 6) {
                    status = `<i class="far fa-times-circle"></i> ${e.pedidostatus}`;
                }

                // formata a data
                let databanco = e.datacadastro.split('T')[0];
                let horabanco = e.datacadastro.split('T')[1];

                let datacadastro = `${databanco.split('-')[2]}/${databanco.split('-')[1]}/${databanco.split('-')[0]} às ${horabanco.split(':')[0]}:${horabanco.split(':')[1]}`;

                let _temp = relatorio.template.trPedido.replace(/\${idpedido}/g, e.idpedido)
                    .replace(/\${cliente}/g, e.nomecliente)
                    .replace(/\${tipoentrega}/g, e.tipoentrega)
                    .replace(/\${formapagamento}/g, e.formapagamento)
                    .replace(/\${datacadastro}/g, datacadastro)
                    .replace(/\${status}/g, status)
                    .replace(/\${total}/g, `R$ ${(parseFloat(e.total).toFixed(2)).toString().replace('.', ',')}`)

                $('#listaPedidos').append(_temp);

                valor_total += e.total

                // último item, renderiza a tabela na tela
                if ((i + 1) == list.length) {

                    // adiciona o total no footer da tabela
                    $("#lblTotalSomaPedidos").text(`R$ ${(parseFloat(valor_total).toFixed(2)).toString().replace('.', ',')}`);

                    $("#data-table").DataTable({
                        destroy: true,
                        aaSorting: [[4, 'desc']],
                        dom: 'Bfrtipl',
                        buttons: ['pageLength'],
                        language: {
                            url: "./js/datatable.pt-BR.json"
                            , buttons: {
                                pageLength: {
                                    _: "Mostrar %d linhas",
                                    '-1': "Mostrar Todos"
                                }
                            }
                        },
                        columnDefs: [
                            { targets: 'no-sort', orderable: false }
                        ]
        
                    });

                }
            })

        }
        else {

            // nenhum registro encontrado
            $(".table-responsive").append('<p class="mb-0">Nenhum pedido encontrado no período selecionado.</p>');

        }

    },


    // abre a modal de detalhes do pedido
    abrirDetalhesPedido: (idpedido) => {

    }

}

relatorio.template = {

    tablePedido: `
        
        <table id="data-table" class="table data-table mb-0">
            <thead>
                <tr>
                    <th># Código</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Pagamento</th>
                    <th>Criado em</th>
                    <th>Status</th>
                    <th>(R$) Total</th>
                    <th class="no-sort">Ações</th>
                </tr>
            </thead>
            <tbody id="listaPedidos">
                
            </tbody>
            <tfoot>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th style="color: #179e40;" id="lblTotalSomaPedidos">-</th>
                    <th></th>
                </tr>
            </tfoot>
        </table>
        
    `,

    trPedido: `
        <tr>
            <td>\${idpedido}</td>
            <td>\${cliente}</td>
            <td>\${tipoentrega}</td>
            <td>\${formapagamento}</td>
            <td>\${datacadastro}</td>
            <td>\${status}</td>
            <td style="color: #179e40;">\${total}</td>
            <td>
                <a href="#!" class="btn btn-white btn-sm" onclick="pedido.method.abrirModalDetalhes('\${idpedido}')">
                    <i class="fas fa-receipt"></i>&nbsp; Detalhes
                </a>
            </td>
        </tr>
    `

}