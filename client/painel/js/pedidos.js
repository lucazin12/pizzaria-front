var pedido = {};

var MODAL_DETALHES = new bootstrap.Modal(document.getElementById('modalDetalhes'));

pedido.event = {

    init: () => {

        app.method.validaToken();
        app.method.carregarDadosEmpresa();

        // inicia a primeira Tab
        pedido.method.openTab('pendentes', 1);

        setInterval(() => {
            pedido.method.atualizarLista()
        }, 10000); // atualiza a cada 10 segundos

    }

}

pedido.method = {

    // método para carregar as tabs
    openTab: (tab, n) => {

        Array.from(document.querySelectorAll(".tab-content")).forEach(e => e.classList.remove('active'));

        document.querySelector("#tab-" + tab).classList.add('active');
        document.querySelector("#lista-pedidos").innerHTML = '';

        app.method.loading(true);

        app.method.get('/pedido/painel/' + n,
            (response) => {

                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                console.log(response.data);

                // carrega a lista de pedidos na tela
                pedido.method.carregarPedidos(response.data);

                // carrega os totais nas tabs
                pedido.method.carregarTotais(response.totais);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )
    },

    // carrega a lista de pedidos na tela
    carregarPedidos: (lista) => {

        if (lista.length > 0) {

            // percorre os pedidos e adiciona na tela
            lista.forEach((e, i) => {

                let btnAcoes = ``;
                let titleBtn = '';
                let acoesPai = `<div class="dropdown-menu" aria-labelledby="menuAcoes">\${acoes}</div>`
                let acoes = '';
                let acoesFinal = '';
                let tipoentregaicon = '';
                let tipoentrega = '';
                let formapagamentoicon = '';
                let formapagamento = '';
                let formapagamentodesc = '';
                let datahora = '';

                // valida as opções de ações
                if (e.idpedidostatus == 1) {
                    titleBtn = 'Pendente';
                    acoes = `
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(2, '${e.idpedido}')">Mover para <b>Aceito</b> <i class="far fa-thumbs-up"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(3, '${e.idpedido}')">Mover para <b>Em preparo</b> <i class="far fa-clock"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(4, '${e.idpedido}')">Mover para <b>Em entrega</b> <i class="fas fa-motorcycle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(5, '${e.idpedido}')">Mover para <b>Concluído</b> <i class="far fa-check-circle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(6, '${e.idpedido}')">Recusar Pedido <i class="far fa-times-circle"></i></a>`
                }
                else if (e.idpedidostatus == 2) {
                    titleBtn = 'Aceito';
                    acoes = `
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(3, '${e.idpedido}')">Mover para <b>Em preparo</b> <i class="far fa-clock"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(4, '${e.idpedido}')">Mover para <b>Em entrega</b> <i class="fas fa-motorcycle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(5, '${e.idpedido}')">Mover para <b>Concluído</b> <i class="far fa-check-circle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(6, '${e.idpedido}')">Recusar Pedido <i class="far fa-times-circle"></i></a>
                    `
                }
                else if (e.idpedidostatus == 3) {
                    titleBtn = 'Em preparo';
                    acoes = `
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(4, '${e.idpedido}')">Mover para <b>Em entrega</b> <i class="fas fa-motorcycle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(5, '${e.idpedido}')">Mover para <b>Concluído</b> <i class="far fa-check-circle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(6, '${e.idpedido}')">Recusar Pedido <i class="far fa-times-circle"></i></a>
                    `
                }
                else if (e.idpedidostatus == 4) {
                    titleBtn = 'Em entrega';
                    acoes = `
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(5, '${e.idpedido}')">Mover para <b>Concluído</b> <i class="far fa-check-circle"></i></a>
                        <a class="dropdown-item" href="#!" onclick="pedido.method.moverPara(6, '${e.idpedido}')">Recusar Pedido <i class="far fa-times-circle"></i></a>
                    `
                }

                // se for diferente de concluido ou recusado, adiciona as ações
                if (e.idpedidostatus != 5 && e.idpedidostatus != 6) {
                    acoesFinal = acoesPai.replace(/\${acoes}/g, acoes);
                    btnAcoes = `
                        <button class="btn btn-white btn-sm dropdown-toggle active" type="button" id="menuAcoes" data-bs-toggle="dropdown" aria-expanded="false">
                            ${titleBtn} 
                        </button>
                    `;
                }


                // valida o tipo de entrega
                if (e.idtipoentrega == 1) {
                    tipoentregaicon = 'fas fa-motorcycle';
                    tipoentrega = 'Delivery'
                }
                else {
                    tipoentregaicon = 'fas fa-box';
                    tipoentrega = 'Retirada'
                }


                // valida a forma de pagamento
                if (e.idformapagamento == 1) {
                    formapagamentoicon = 'fas fa-receipt';
                    formapagamento = 'Pix';
                    formapagamentodesc = 'Pagamento na entrega do pedido.'
                }
                else if (e.idformapagamento == 2) {
                    formapagamentoicon = 'fas fa-coins';
                    formapagamento = 'Dinheiro';
                    formapagamentodesc = e.troco != null ? `Troco para: ${(e.troco).toFixed(2).replace('.', ',')} reais` : 'Pagamento na entrega do pedido.'
                }
                else if (e.idformapagamento == 3) {
                    formapagamentoicon = 'fas fa-credit-card';
                    formapagamento = 'Cartão de Crédito';
                    formapagamentodesc = e.idtipoentrega == 1 ? 'Levar maquininha de cartão.' : 'Pagamento na retirada do pedido.'
                }
                else if (e.idformapagamento == 4) {
                    formapagamentoicon = 'fas fa-credit-card';
                    formapagamento = 'Cartão de Débito';
                    formapagamentodesc = e.idtipoentrega == 1 ? 'Levar maquininha de cartão.' : 'Pagamento na retirada do pedido.'
                }


                // formata a data e hora de recebimento
                let datacadastro = e.datacadastro.split('T');
                let dataFormatada = datacadastro[0].split('-')[2] + '/' + datacadastro[0].split('-')[1];
                let horarioFormatado = datacadastro[1].split(':')[0] + ':' + datacadastro[1].split(':')[1];

                datahora = `${dataFormatada} às ${horarioFormatado}`;

                let temp = pedido.template.card.replace(/\${idpedido}/g, e.idpedido)
                    .replace(/\${btnAcoes}/g, btnAcoes)
                    .replace(/\${acoes}/g, acoesFinal)
                    .replace(/\${nome}/g, e.nomecliente)
                    .replace(/\${tipoentregaicon}/g, tipoentregaicon)
                    .replace(/\${tipoentrega}/g, tipoentrega)
                    .replace(/\${formapagamentoicon}/g, formapagamentoicon)
                    .replace(/\${formapagamento}/g, formapagamento)
                    .replace(/\${formapagamentodesc}/g, formapagamentodesc)
                    .replace(/\${datahora}/g, datahora)
                    .replace(/\${total}/g, (e.total).toFixed(2).replace('.', ','))

                // adiciona o pedido na tela
                document.querySelector("#lista-pedidos").innerHTML += temp;

            })

        }
        else {
            // nenhum pedido encontrado
        }

    },

    // carrega os totais nas tabs
    carregarTotais: (data) => {

        // primeiro oculta todos os totais
        document.querySelector("#badge-total-pendentes").classList.add('hidden');
        document.querySelector("#badge-total-aceito").classList.add('hidden');
        document.querySelector("#badge-total-preparo").classList.add('hidden');
        document.querySelector("#badge-total-entrega").classList.add('hidden');

        if (data.pendente > 0) {
            document.querySelector("#badge-total-pendentes").classList.remove('hidden');
            document.querySelector("#badge-total-pendentes").innerText = data.pendente;
        }

        if (data.aceito > 0) {
            document.querySelector("#badge-total-aceito").classList.remove('hidden');
            document.querySelector("#badge-total-aceito").innerText = data.aceito;
        }

        if (data.preparo > 0) {
            document.querySelector("#badge-total-preparo").classList.remove('hidden');
            document.querySelector("#badge-total-preparo").innerText = data.preparo;
        }

        if (data.entrega > 0) {
            document.querySelector("#badge-total-entrega").classList.remove('hidden');
            document.querySelector("#badge-total-entrega").innerText = data.entrega;
        }

    },

    // abre a modal de detalhes do pedido
    abrirModalDetalhes: (idpedido) => {

        MODAL_DETALHES.show();

        app.method.loading(true);

        app.method.get('/pedido/' + idpedido,
            (response) => {

                console.log(response)
                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                pedido.method.carregarModalDetalhes(response.data, idpedido, response.cart)

            },
            (error) => {
                console.log('error', error)
                app.method.loading(false);
            }, true
        )

    },

    // carrega os dados da modal de detalhes
    carregarModalDetalhes: (data, idpedido, cart) => {

        let datacadastro = data.datacadastro.split('T');
        let dataFormatada = datacadastro[0].split('-')[2] + '/' + datacadastro[0].split('-')[1];
        let horarioFormatado = datacadastro[1].split(':')[0] + ':' + datacadastro[1].split(':')[1];

        document.querySelector("#lblDataHora").innerText = `Recebido em ${dataFormatada} às ${horarioFormatado}`;

        document.querySelector("#lblNomeCliente").innerText = data.nomecliente;
        document.querySelector("#lblTelefoneCliente").innerText = data.telefonecliente;

        document.querySelector("#lblTipoEntrega").innerHTML = data.idtipoentrega == 1 ? `<i class="fas fa-motorcycle"></i> Entrega` : '<i class="fas fa-box"></i> Retirada'

        document.querySelector("#lblFormaPagamentoTitulo").innerText = data.formapagamento;
        document.querySelector("#lblFormaPagamentoDescricao").innerText = 'Pagamento na entrega do pedido';

        if (data.idformapagamento == 1) {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-receipt"></i>';
        }
        else if (data.idformapagamento == 2) {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-coins"></i>';
            document.querySelector("#lblFormaPagamentoDescricao").innerText = data.troco > 0 ? `Troco para: ${(data.troco).toFixed(2).replace('.', ',')} reais` : 'Pagamento na entrega do pedido';
        }
        else {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-credit-card"></i>';
            document.querySelector("#lblFormaPagamentoDescricao").innerText = data.idtipoentrega == 1 ? 'Levar maquininha de cartão.' : 'Pagamento na retirada do pedido.';
        }

        if (data.idtipoentrega == 1) {
            // delivery
            document.querySelector("#container-endereco").classList.remove('hidden');
            document.querySelector("#lblEndereco").innerText = `${data.endereco}, ${data.numero}, ${data.bairro}${data.complemento.length > 0 ? ` (${data.complemento})` : ''}`;
            document.querySelector("#lblCep").innerText = `${data.cidade}-${data.estado} / CEP:${data.cep}`;
        }
        else {
            // retirada
            document.querySelector("#container-endereco").classList.add('hidden');
        }

        // carrega o botão final
        if (data.idpedidostatus != 5 && data.idpedidostatus != 6) {
            // só exibe o botão se o status for diferente de conlcuido e recusado

            if (data.idpedidostatus == 1) {
                document.querySelector("#container-action-footer").innerHTML = `<button onclick="pedido.method.moverPara(2, '${idpedido}')" type="button" class="btn btn-yellow btn-sm">Aceitar Pedido</button>`;
            }
            if (data.idpedidostatus == 2) {
                document.querySelector("#container-action-footer").innerHTML = `<button onclick="pedido.method.moverPara(3, '${idpedido}')" type="button" class="btn btn-yellow btn-sm">Preparar Pedido</button>`;
            }
            if (data.idpedidostatus == 3) {
                document.querySelector("#container-action-footer").innerHTML = `<button onclick="pedido.method.moverPara(4, '${idpedido}')" type="button" class="btn btn-yellow btn-sm">Entregar Pedido</button>`;
            }
            if (data.idpedidostatus == 4) {
                document.querySelector("#container-action-footer").innerHTML = `<button onclick="pedido.method.moverPara(5, '${idpedido}')" type="button" class="btn btn-yellow btn-sm">Concluir Pedido</button>`;
            }

        }
        else {
            document.querySelector("#container-action-footer").innerHTML = '';
        }


        document.querySelector("#itensPedido").innerHTML = '';

        // organiza o carrinho em grupo
        var itens_pedido = cart.reduce(function (results, item) {
            (results[item.idpedidoitem] = results[item.idpedidoitem] || []).push(item);
            return results;
        }, {});

        console.log('itens_pedido', itens_pedido);

        var order = [];

        for (var key in itens_pedido) {

            var obj = itens_pedido[key];

            // cria o objeto principal do item
            var _item = {
                idpedidoitem: obj[0].idpedidoitem,
                nome: obj[0].nome,
                observacao: obj[0].observacao,
                quantidade: obj[0].quantidade,
                valor: obj[0].valor,
                opcionais: []
            }

            obj.forEach((e, i) => {

                // monta a lista de opcionais
                if (e.idopcionalitem != null) {

                    var _opc = {
                        idopcionalitem: e.idopcionalitem,
                        nomeopcional: e.nomeopcional,
                        valoropcional: e.valoropcional,
                    }

                    // adiciona o opcional na lista
                    _item.opcionais.push(_opc);

                }

            })

            // adiciona o item no objeto de order
            order.push(_item);

        }


        console.log('order', order)

        // carrega o carrinho
        order.forEach((e, i) => {

            let itens = '';

            if (e.opcionais.length > 0) {
                // monta a lista de opcionais
                for (let index = 0; index < e.opcionais.length; index++) {
                    let element = e.opcionais[index];

                    itens += pedido.template.opcional.replace(/\${nome}/g, `${e.quantidade}x ${element.nomeopcional}`)
                        .replace(/\${preco}/g, `+ R$ ${(element.valoropcional * e.quantidade).toFixed(2).replace('.', ',')}`)
                }
            }

            let obs = '';

            // valida se existe observação
            if (e.observacao != null && e.observacao.length > 0) {
                obs = pedido.template.obs.replace(/\${observacao}/g, e.observacao);
            }

            let temp = pedido.template.produto.replace(/\${guid}/g, e.guid)
                .replace(/\${nome}/g, `${e.quantidade}x ${e.nome}`)
                .replace(/\${preco}/g, `R$ ${(e.quantidade * e.valor).toFixed(2).replace('.', ',')}`)
                .replace(/\${obs}/g, obs)
                .replace(/\${opcionais}/g, itens)

            // adiciona a categoria ao menu
            document.querySelector("#itensPedido").innerHTML += temp;

        });

        // valida se tem taxa 
        if (data.taxaentrega > 0) {
            let temptaxa = pedido.template.taxaentrega.replace(/\${total}/g, `+ R$ ${(data.taxaentrega).toFixed(2).replace('.', ',')}`)
            document.querySelector("#itensPedido").innerHTML += temptaxa;
        }

        let temptotal = pedido.template.total.replace(/\${total}/g, `R$ ${(data.total).toFixed(2).replace('.', ',')}`)

        document.querySelector("#itensPedido").innerHTML += temptotal;

    },

    // mode o pedido para outra tab
    moverPara: (target, idpedido) => {

        // se for recusar, abre a modal de confirmação
        if (parseInt(target) == 6) {
            return;
        }

        var dados = {
            tab: target,
            idpedido: idpedido
        }

        app.method.loading(true);

        app.method.post('/pedido/mover', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                pedido.method.atualizarLista();

                // fecha a modal de detalhes se estiver aberta
                MODAL_DETALHES.hide();

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // método chamado para atualizar a lista de acordo com a tab selecionada
    atualizarLista: () => {

        // valida qual é o target, pra carregar os itens da tab atual (volta 1)
        let tabAtiva = document.querySelector(".tab-content.active").id;

        if (tabAtiva == 'tab-pendentes') {
            pedido.method.openTab('pendentes', 1);
        }
        else if (tabAtiva == 'tab-aceito') {
            pedido.method.openTab('aceito', 2);
        }
        else if (tabAtiva == 'tab-preparo') {
            pedido.method.openTab('preparo', 3);
        }
        else if (tabAtiva == 'tab-entrega') {
            pedido.method.openTab('entrega', 4);
        }

    }

}

pedido.template = {

    card: `
        <div class="col-3 mb-4">
            <div class="card card-pedido">
                <div class="card-pedido-header">
                    <div class="dropdown">
                        \${btnAcoes}
                        \${acoes}
                    </div>
                    <p class="numero-pedido mt-2">#\${idpedido}</p>
                </div>
                <div class="card-content" onclick="pedido.method.abrirModalDetalhes('\${idpedido}')">
                    <div class="card-pedido-body mt-3">
                        <p class="info-pedido">
                            <i class="fas fa-user"></i>
                            \${nome}
                        </p>
                        <p class="info-pedido">
                            <i class="\${tipoentregaicon}"></i>
                            \${tipoentrega}
                        </p>
                        <p class="info-pedido">
                            <i class="\${formapagamentoicon}"></i>
                            \${formapagamento}
                            <span>\${formapagamentodesc}</span>
                        </p>
                    </div>
                    <div class="separate"></div>
                    
                    <div class="card-pedido-footer">
                        <p class="horario-pedido">\${datahora}</p>
                        <p class="total-pedido"><b>R$ \${total}</b></p>
                    </div>
                </div>
                
            </div>
        </div>
    `,

    produto: `
        <div class="card-item mb-2">
            <div class="container-detalhes">
                <div class="detalhes-produto">
                    <div class="infos-produto">
                        <p class="name"><b>\${nome}</b></p>
                        <p class="price"><b>\${preco}</b></p>
                    </div>
                    \${opcionais}
                    \${obs}
                </div>
            </div>
        </div>
    `,

    opcional: `
        <div class="infos-produto">
            <p class="name-opcional mb-0">\${nome}</p>
            <p class="price-opcional mb-0">\${preco}</p>
        </div>
    `,

    obs: `
        <div class="infos-produto">
            <p class="obs-opcional mb-0">- \${observacao}</p>
        </div>
    `,

    taxaentrega: `
        <div class="card-item mb-2">
            <div class="detalhes-produto">
                <div class="infos-produto">
                    <p class="name mb-0"><i class="fas fa-motorcycle"></i>&nbsp; <b>Taxa de entrega</b></p>
                    <p class="price mb-0"><b>\${total}</b></p>
                </div>
            </div>
        </div>
    `,

    total: `
        <div class="card-item mb-2">
            <div class="detalhes-produto">
                <div class="infos-produto">
                    <p class="name-total mb-0"><b>Total</b></p>
                    <p class="price-total mb-0"><b>\${total}</b></p>
                </div>
            </div>
        </div>
    `

}