document.addEventListener("DOMContentLoaded", function (event) {
    app.event.init(false);
    pedido.event.init();
});

var pedido = {};

var ORDER = null;

var MODAL_DETALHES = new bootstrap.Modal(document.getElementById('modalDetalhes'));

pedido.event = {

    init: () => {

        pedido.method.obterUltimoPedido();
        setInterval(() => {
            pedido.method.obterUltimoPedido();
        }, 15000);

        pedido.method.obterItensCarrinho();

    }

}

pedido.method = {

    // obtem último pedido
    obterUltimoPedido: () => {

        // primeiro, pega o carrinho que já existe no local
        let pedidoLocal = app.method.obterValorSessao('order');

        if (pedidoLocal != undefined) {

            let order = JSON.parse(pedidoLocal);

            ORDER = order;

            console.log('order', order);

            document.querySelector('#containerNenhumPedido').classList.add('hidden');
            document.querySelector('#containerAcompanhamento').classList.remove('hidden');

            app.method.loading(true);

            app.method.get('/pedido/' + order.order,
                (response) => {

                    console.log(response)
                    app.method.loading(false);

                    if (response.status == "error") {
                        console.log(response.message)
                        return;
                    }

                    // primeiro, carrega o card principal do pedido
                    document.querySelector("#containerAcompanhamento").innerHTML = '';

                    let datacadastro = response.data.datacadastro.split('T');
                    let dataFormatada = datacadastro[0].split('-')[2] + '/' + datacadastro[0].split('-')[1];
                    let horarioFormatado = datacadastro[1].split(':')[0] + ':' + datacadastro[1].split(':')[1];

                    console.log('dataFormatada', dataFormatada);
                    console.log('horarioFormatado', horarioFormatado);

                    let temp = pedido.template.dadospedido.replace(/\${data}/g, `${dataFormatada} às ${horarioFormatado}`)
                        .replace(/\${valor}/g, `R$ ${(response.data.total).toFixed(2).replace('.', ',')}`);

                    document.querySelector("#containerAcompanhamento").innerHTML += temp;

                    pedido.method.carregarEtapas(response.data);

                    pedido.method.carregarModalDetalhes(response.data)

                },
                (error) => {
                    console.log('error', error)
                    app.method.loading(false);
                }, true
            )

        }
        else {
            ORDER = null;
            document.querySelector('#containerNenhumPedido').classList.remove('hidden');
            document.querySelector('#containerAcompanhamento').classList.add('hidden');
        }


    },

    // carrega as etapas do pedido
    carregarEtapas: (data) => {


        // Pedido recusado
        if (data.idpedidostatus == 6) {
            let temp = pedido.template.cancelado;
            document.querySelector("#containerAcompanhamento").innerHTML += temp;
            return;
        }


        let pedidoEnviado = pedido.template.etapa.replace(/\${icone}/g, '<i class="fas fa-clock"></i>')
            .replace(/\${titulo}/g, 'Pedido enviado!')

        let preparando = pedido.template.etapa.replace(/\${icone}/g, '<i class="fas fa-utensils"></i>')
            .replace(/\${titulo}/g, 'Preparando')

        let indo = pedido.template.etapa.replace(/\${icone}/g, data.idtipoentrega == 1 ? '<i class="fas fa-motorcycle"></i>' : '<i class="fas fa-box"></i>')
            .replace(/\${titulo}/g, data.idtipoentrega == 1 ? 'Indo até você' : 'Pedido pronto!')


        // pendente
        if (data.idpedidostatus == 1) {

            pedidoEnviado = pedidoEnviado.replace(/\${status}/g, 'active')
                .replace(/\${status-icon}/g, '')
                .replace(/\${descricao}/g, 'Aguardando a confirmação da loja')

            preparando = preparando.replace(/\${status}/g, 'pending')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            indo = indo.replace(/\${status}/g, 'pending')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

        }

        // em preparo
        if (data.idpedidostatus == 2 || data.idpedidostatus == 3) {

            pedidoEnviado = pedidoEnviado.replace(/\${status}/g, '')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            preparando = preparando.replace(/\${status}/g, 'active')
                .replace(/\${status-icon}/g, '')
                .replace(/\${descricao}/g, 'Seu pedido está sendo preparado')

            indo = indo.replace(/\${status}/g, 'pending')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

        }

        // entrega
        if (data.idpedidostatus == 4) {

            pedidoEnviado = pedidoEnviado.replace(/\${status}/g, '')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            preparando = preparando.replace(/\${status}/g, '')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            indo = indo.replace(/\${status}/g, 'active')
                .replace(/\${status-icon}/g, '')
                .replace(/\${descricao}/g, data.idtipoentrega == 1 ? 'Saiu para entrega' : 'Seu pedido já pode ser retirado')

        }

        // concluido
        if (data.idpedidostatus == 5) {

            pedidoEnviado = pedidoEnviado.replace(/\${status}/g, '')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            preparando = preparando.replace(/\${status}/g, '')
                .replace(/\${status-icon}/g, 'status')
                .replace(/\${descricao}/g, '')

            indo = indo.replace(/\${status}/g, 'active')
                .replace(/\${status-icon}/g, '')
                .replace(/\${descricao}/g, 'Seu pedido foi entregue')

        }

        document.querySelector("#containerAcompanhamento").innerHTML += pedidoEnviado;
        document.querySelector("#containerAcompanhamento").innerHTML += preparando;
        document.querySelector("#containerAcompanhamento").innerHTML += indo;

    },

    // valida quantos itens tem no carrinho e exibe o icone
    obterItensCarrinho: () => {

        // primeiro, pega o carrinho que já existe no local
        let carrinho = app.method.obterValorSessao('cart');

        if (carrinho != undefined) {

            let cart = JSON.parse(carrinho);

            if (cart.itens.length > 0) {
                document.querySelector("#icone-carrinho-vazio").classList.add('hidden');
                document.querySelector("#total-carrinho").classList.remove('hidden');
                document.querySelector("#total-carrinho").innerText = cart.itens.length;
            }
            else {
                document.querySelector("#icone-carrinho-vazio").classList.remove('hidden');
                document.querySelector("#total-carrinho").classList.add('hidden');
                document.querySelector("#total-carrinho").innerText = 0;
            }

        }
        else {
            document.querySelector("#icone-carrinho-vazio").classList.remove('hidden');
            document.querySelector("#total-carrinho").classList.add('hidden');
            document.querySelector("#total-carrinho").innerText = 0;
        }

    },

    // abre a modal para exibir o carrinho
    abrirModalDetalhesPedido: () => {
        MODAL_DETALHES.show();
    },

    fecharModalDetalhesPedido: () => {
        MODAL_DETALHES.hide();
    },

    // carrega os dados da modal de detalhes
    carregarModalDetalhes: (data) => {

        document.querySelector("#itensPedido").innerHTML = '';

        document.querySelector("#lblNomeCliente").innerText = ORDER.nomecliente;
        document.querySelector("#lblTelefoneCliente").innerText = ORDER.telefonecliente;

        document.querySelector("#lblFormaPagamentoTitulo").innerText = data.formapagamento;
        document.querySelector("#lblFormaPagamentoDescricao").innerText = 'Pagamento na entrega do pedido';

        if (ORDER.idformapagamento == 1) {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-receipt"></i>';
        }
        else if (ORDER.idformapagamento == 2) {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-coins"></i>';
            document.querySelector("#lblFormaPagamentoDescricao").innerText = ORDER.troco > 0 ? `Troco para: ${ORDER.troco} reais` : 'Pagamento na entrega do pedido';
        }
        else {
            document.querySelector("#lblFormaPagamentoIcon").innerHTML = '<i class="fas fa-credit-card"></i>';
        }

        // carrega o carrinho
        ORDER.cart.forEach((e, i) => {

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
            if (e.observacao.length > 0) {
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


        // total carrinho
        let total = 0;

        // preenche os produtos na tela
        ORDER.cart.forEach((e, i) => {

            let subTotal = 0;

            if (e.opcionais.length > 0) {
                // monta a lista de opcionais
                for (let index = 0; index < e.opcionais.length; index++) {
                    let element = e.opcionais[index];

                    subTotal += element.valoropcional * e.quantidade;
                }
            }

            subTotal += (e.quantidade * e.valor);
            total += subTotal;

        });

        // valida se tem taxa 
        if (ORDER.taxaentrega > 0) {
            total += ORDER.taxaentrega;

            let temptaxa = pedido.template.taxaentrega.replace(/\${total}/g, `+ R$ ${(ORDER.taxaentrega).toFixed(2).replace('.', ',')}`)

            document.querySelector("#itensPedido").innerHTML += temptaxa;
        }

        let temptotal = pedido.template.total.replace(/\${total}/g, `R$ ${(total).toFixed(2).replace('.', ',')}`)

        document.querySelector("#itensPedido").innerHTML += temptotal;

    },

    // envia a msg para o whatsapp
    mensagemWhatsApp: () => {

        var texto = 'Olá! gostaria de saber sobre meu pedido: Nº ' + ORDER.order;

        // converte para URL
        let encode = encodeURI(texto);
        let URL = `https://wa.me/5517991686069?text=${encode}`;

        window.location.href = URL;

    },

}

pedido.template = {

    dadospedido: `
        <div class="card card-status-pedido mb-4">
            <div class="detalhes-produto">
                <div class="infos-produto">
                    <p class="name-total mb-0"><b>\${data}</b></p>
                    <p class="price-total mb-0"><b>\${valor}</b></p>
                </div>
            </div>
            <div class="detalhes-produto-acoes" onclick="pedido.method.mensagemWhatsApp()">
                <i class="fab fa-whatsapp"></i>
                <p class="mb-0 mt-1">Mensagem</p>
            </div>
            <div class="detalhes-produto-acoes" onclick="pedido.method.abrirModalDetalhesPedido()">
                <i class="far fa-file-alt"></i>
                <p class="mb-0 mt-1">Ver Pedido</p>
            </div>
        </div>
    `,

    etapa: `
        <div class="card card-status-pedido mt-2 \${status}">
            <div class="img-icon-details \${status-icon}">
                \${icone}
            </div>
            <div class="infos">
                <p class="name mb-1"><b>\${titulo}</b></p>
                \${descricao}
            </div>
        </div>
    `,

    cancelado: `
        <div class="card card-status-pedido cancelado mt-2">
            <div class="img-icon-details">
                <i class="fas fa-times"></i>
            </div>
            <div class="infos">
                <p class="name mb-1"><b>Pedido cancelado!</b></p>
                <span class="text mb-0">O restaurante cancelou seu pedido. Desculpe o transtorno.</span>
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