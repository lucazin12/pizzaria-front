document.addEventListener("DOMContentLoaded", function (event) {
    app.event.init();
    item.event.init();
});

var item = {};
var ITEM_ID = 0;
var PRODUTO = {};
var OPCIONAIS = [];
var OPCIONAIS_SELECIONADOS = [];
var QUANTIDADE_SELECIONADA = 1;
var VALIDACOES = [];

item.event = {

    init: () => {

        var url = new URL(window.location.href);
        var p = url.searchParams.get("p");

        console.log('p', p)

        if (p != null && p.trim() != '' && !isNaN(p)) {

            ITEM_ID = p;
            item.method.obterDadosProduto();
            item.method.obterOpcionaisProduto();

        }
        else {
            window.location.href = '/index.html'
        }

    }

}

item.method = {

    // obtem os dados do produto
    obterDadosProduto: () => {

        app.method.loading(true);
        PRODUTO = {};

        app.method.get('/produto/' + ITEM_ID,
            (response) => {

                console.log(response)
                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                let produto = response.data[0];
                PRODUTO = produto;

                // carrega as informações do produto

                if (produto.imagem != null) {
                    document.getElementById("img-produto").style.backgroundImage = `url('../public/images/${produto.imagem}')`;
                    document.getElementById("img-produto").style.backgroundSize = "cover";
                }
                else {
                    document.getElementById("img-produto").style.backgroundImage = `url('../public/images/default.jpg')`;
                    document.getElementById("img-produto").style.backgroundSize = "cover";
                }

                document.getElementById("titulo-produto").innerText = produto.nome;
                document.getElementById("descricao-produto").innerText = produto.descricao;

                document.getElementById("preco-produto").innerText = `R$ ${(produto.valor).toFixed(2).replace('.', ',')}`;
                document.getElementById("btn-preco-produto").innerText = `R$ ${(produto.valor).toFixed(2).replace('.', ',')}`;

            },
            (error) => {
                console.log('error', error)
                app.method.loading(false);
            }, true
        )

    },

    // obtem os opcionais do produto
    obterOpcionaisProduto: () => {

        app.method.get('/opcional/produto/' + ITEM_ID,
            (response) => {

                console.log(response)

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                OPCIONAIS = response.data;

                item.method.carregarOpcionais(response.data);
                item.method.carregarOpcionaisSimples(response.data);

            },
            (error) => {
                console.log('error', error)
            }, true
        )

    },

    carregarOpcionais: (lista) => {

        document.querySelector("#listaOpcionais").innerHTML = '';

        if (lista.length > 0) {

            // agrupa o resto pelo titulo (opcionais de seleção)
            let listaSelecao = lista.filter((elem) => { return elem.tiposimples == 0 });
            let listaAgrupada = Object.groupBy(listaSelecao, ({ idopcional }) => idopcional);

            console.log('listaAgrupada', listaAgrupada)

            // carrega a lista agrupada
            Object.entries(listaAgrupada).forEach((e, i) => {

                let opcional = e[1];

                let obrigatorio = '';
                let subtitulo = '';
                let itens = '';

                // valida se é obrigatória ou não, e altera o subtitulo
                let minimo = opcional[0].minimo;
                let maximo = opcional[0].maximo;

                if (minimo === maximo) {
                    if (minimo > 1) {
                        subtitulo = `Escolha ${minimo} opções`;
                        obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
                        VALIDACOES.push({ idopcional: e[0] }); // já deixa na variavel globar pra saber que temos que validar esse campo
                    }
                    else {
                        subtitulo = `Escolha 1 opção`;
                        obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
                        VALIDACOES.push({ idopcional: e[0] }); // já deixa na variavel globar pra saber que temos que validar esse campo
                    }
                }
                if (minimo < maximo) {
                    if (minimo > 0) {
                        subtitulo = `Escolha de ${minimo} até ${maximo} opções`;
                        obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
                        VALIDACOES.push({ idopcional: e[0] }); // já deixa na variavel globar pra saber que temos que validar esse campo
                    }
                    else {
                        if (maximo > 1) {
                            subtitulo = `Escolha até ${maximo} opções`;
                        }
                        else {
                            subtitulo = `Escolha até 1 opção`;
                        }
                    }
                }

                // monta a lista de itens
                for (let index = 0; index < opcional.length; index++) {
                    let element = opcional[index];
                    console.log('element', element);

                    let valor = '';

                    if (element.valoropcional > 0) {
                        valor = `+ R$ ${(element.valoropcional).toFixed(2).replace('.', ',')}`;
                    }

                    itens += item.template.opcionalItem.replace(/\${idopcionalitem}/g, element.idopcionalitem)
                        .replace(/\${nome}/g, element.nomeopcional)
                        .replace(/\${valor}/g, valor)
                        .replace(/\${idopcional}/g, e[0])
                }

                let temp = item.template.opcional.replace(/\${idopcional}/g, e[0])
                    .replace(/\${obrigatorio}/g, obrigatorio)
                    .replace(/\${titulo}/g, opcional[0].titulo)
                    .replace(/\${sub-titulo}/g, subtitulo)
                    .replace(/\${minimo}/g, minimo)
                    .replace(/\${maximo}/g, maximo)
                    .replace(/\${itens}/g, itens)

                // adiciona a categoria ao menu
                document.querySelector("#listaOpcionais").innerHTML += temp;

                // último item
                if ((i + 1) == listaAgrupada.length) {

                }

            });

        }

    },

    // carrega a lista de opcionais simples
    carregarOpcionaisSimples: (lista) => {

        // pega a lista dos opcionais simples
        let listaSimples = lista.filter((elem) => { return elem.tiposimples == 1 });

        console.log('listaSimples', listaSimples)

        document.querySelector("#listaOpcionaisSimples").innerHTML = '';

        if (listaSimples.length > 0) {

            document.querySelector("#containerOpcionaisSimples").classList.remove('hidden');

            listaSimples.forEach((e, i) => {

                let valor = '';

                if (e.valoropcional > 0) {
                    valor = `+ R$ ${(e.valoropcional).toFixed(2).replace('.', ',')}`;
                }

                let temp = item.template.opcionalItemSimples.replace(/\${idopcionalitem}/g, e.idopcionalitem)
                    .replace(/\${nome}/g, e.nomeopcional)
                    .replace(/\${valor}/g, valor)

                // adiciona a categoria ao menu
                document.querySelector("#listaOpcionaisSimples").innerHTML += temp;

            });

        }
        else {
            document.querySelector("#containerOpcionaisSimples").remove();
        }

    },

    // diminui a quantidade selecionada
    diminuirQuantidade: () => {

        if (QUANTIDADE_SELECIONADA === 1) {
            return;
        }

        QUANTIDADE_SELECIONADA -= 1;
        document.querySelector("#qntd-carrinho").innerText = QUANTIDADE_SELECIONADA
        item.method.atualizarSacola();

    },

    // aumenta a quantidade selecionada
    aumentarQuantidade: () => {

        QUANTIDADE_SELECIONADA += 1;
        document.querySelector("#qntd-carrinho").innerText = QUANTIDADE_SELECIONADA
        item.method.atualizarSacola();

    },

    // seleciona o opcional
    selecionarOpcional: (idopcionalitem, idopcional) => {

        let selecionado = document.querySelector("#check-opcional-" + idopcionalitem).checked;
        let inputsSelecao = document.getElementsByClassName('paiopcional-' + idopcional);
        let opcional = OPCIONAIS.filter((e) => { return e.idopcionalitem == idopcionalitem });

        // faz todas as validações 
        if (opcional[0].minimo === opcional[0].maximo) {

            if (opcional[0].minimo > 1) {
                // +1 opção && obrigatório (Escolha ${minimo} opções)
                console.log('Escolha ${minimo} opções')
                item.method.validacaoCheckMaisDeUmaOpcao(opcional, selecionado, idopcional, idopcionalitem, true);
            }
            else {
                // 1 opção && obrigatório (Escolha 1 opção)
                console.log('Escolha 1 opção')
                item.method.validacaoCheckUmaOpcao(opcional, selecionado, idopcional, idopcionalitem, inputsSelecao, true);
            }
        }
        if (opcional[0].minimo < opcional[0].maximo) {

            if (opcional[0].minimo > 0) {
                // de +1 até +2 opções && obrigatório (Escolha de ${minimo} até ${maximo} opções)
                console.log('Escolha de ${minimo} até ${maximo} opções')
                item.method.validacaoCheckMaisDeUmaOpcao(opcional, selecionado, idopcional, idopcionalitem, true);
            }
            else {
                if (opcional[0].maximo > 1) {
                    // +1 opção && NÃO obrigatório (Escolha até ${maximo} opções)
                    console.log('Escolha até ${maximo} opções')
                    item.method.validacaoCheckMaisDeUmaOpcao(opcional, selecionado, idopcional, idopcionalitem);
                }
                else {
                    // 1 opção && NÃO obrigatório (Escolha até 1 opção)
                    console.log('Escolha até 1 opção')
                    item.method.validacaoCheckUmaOpcao(opcional, selecionado, idopcional, idopcionalitem, inputsSelecao, true);
                }
            }
        }

    },

    // método para validar os checks de +1 opção e Obrigatório
    validacaoCheckMaisDeUmaOpcao: (opcional, selecionado, idopcional, idopcionalitem, obrigatorio = false) => {

        // obtem quantas opções já tem na lista
        let filtro = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcional == idopcional; });

        // se chegou no máximo, trava a seleção de mais opções
        if (filtro.length >= opcional[0].maximo) {

            if (selecionado) {
                // Se for para selecionar, remove o check do atual e não adiciona
                document.querySelector("#check-opcional-" + idopcionalitem).checked = false;
                app.method.mensagem(`Limite de ${opcional[0].maximo} opções atingido.`);
            }
            else {
                // Se não estiver selecionando então remove o item da lista
                let outros = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcionalitem != idopcionalitem; });
                OPCIONAIS_SELECIONADOS = outros;
            }

        }
        else {
            // não atingiu o limite das opções selecionadas

            if (selecionado) {
                // Se for para selecionar, adiciona na lista
                OPCIONAIS_SELECIONADOS.push(opcional[0]);
            }
            else {
                // Se não estiver selecionando então remove o item da lista
                let outros = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcionalitem != idopcionalitem; });
                OPCIONAIS_SELECIONADOS = outros;
            }

        }

        if (obrigatorio) {

            // valida quantos opcionais foram selecionados
            let filtroOpcionais = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcional == idopcional; });

            if (filtroOpcionais.length >= opcional[0].maximo) {
                // remove das validações
                let filtroValidacoes = VALIDACOES.filter((e) => { return e.idopcional != idopcional; });
                VALIDACOES = filtroValidacoes;
                document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML = '<i class="fas fa-check"></i>';
            }
            else {
                // adiciona para validação
                VALIDACOES.push({ idopcional: idopcional });
                document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML = 'Obrigatório';
            }

        }

        item.method.atualizarSacola();

    },

    // método para validar os checks de 1 opção e Obrigatório
    validacaoCheckUmaOpcao: (opcional, selecionado, idopcional, idopcionalitem, inputsSelecao, obrigatorio = false) => {

        // remove o check de todos
        Array.from(inputsSelecao).forEach((e) => { e.checked = false; });

        // remove todos dos opcionais selecionados
        let filtro = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcional != idopcional; });
        OPCIONAIS_SELECIONADOS = filtro;

        if (selecionado) {
            // adiciona o check no atual e adiciona ele nos opcionais selecionados
            document.querySelector("#check-opcional-" + idopcionalitem).checked = true;
            OPCIONAIS_SELECIONADOS.push(opcional[0])

            if (obrigatorio) {
                // remove das validações
                let filtroValidacoes = VALIDACOES.filter((e) => { return e.idopcional != idopcional; });
                VALIDACOES = filtroValidacoes;
                document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML = '<i class="fas fa-check"></i>';
            }

        }
        else {
            if (obrigatorio) {
                // adiciona para validação
                VALIDACOES.push({ idopcional: idopcional });
                document.querySelector("#badge-obrigatorio-" + idopcional).innerHTML = 'Obrigatório';
            }
        }

        item.method.atualizarSacola();

    },

    // seleciona o opcional clicado
    selecionarOpcionalSimples: (idopcionalitem) => {

        let selecionado = document.querySelector("#check-opcional-" + idopcionalitem).checked;

        let opcional = OPCIONAIS.filter((e) => { return e.idopcionalitem == idopcionalitem });

        if (selecionado) {
            // adiciona
            let filtro = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcionalitem == opcional[0].idopcionalitem; });

            if (filtro.length <= 0) {
                OPCIONAIS_SELECIONADOS.push(opcional[0]);
            }
        }
        else {
            //remove
            let filtro = OPCIONAIS_SELECIONADOS.filter((e) => { return e.idopcionalitem != opcional[0].idopcionalitem; });
            OPCIONAIS_SELECIONADOS = filtro;
        }

        item.method.atualizarSacola();

    },

    // atualiza o valor total da sacola
    atualizarSacola: () => {

        let valorTotal = PRODUTO.valor;

        // soma os opcionais
        for (let index = 0; index < OPCIONAIS_SELECIONADOS.length; index++) {
            const element = OPCIONAIS_SELECIONADOS[index];

            if (element.valoropcional > 0) {
                valorTotal += element.valoropcional;
            }

        }

        valorTotal = QUANTIDADE_SELECIONADA * valorTotal;

        document.getElementById("btn-preco-produto").innerText = `R$ ${(valorTotal).toFixed(2).replace('.', ',')}`;

    },

    // adiciona ao carrinho
    adicionarAoCarrinho: () => {

        let observacao = document.querySelector("#txtObservacao").value.trim();

        // valida os campos
        if (VALIDACOES.length > 0) {
            app.method.mensagem("Selecione os campos obrigatórios.")
            return;
        }

        // primeiro, pega o carrinho que já existe no local
        let carrinho = app.method.obterValorSessao('cart');

        // inicia um carrinho
        let cart = {
            itens: []
        };

        if (carrinho != undefined) {
            cart = JSON.parse(carrinho);
        }

        let guid = app.method.criarGuid();

        // adiciona o produto ao carrinho
        cart.itens.push({
            guid: guid,
            idproduto: PRODUTO.idproduto,
            nome: PRODUTO.nome,
            imagem: PRODUTO.imagem,
            valor: PRODUTO.valor,
            quantidade: QUANTIDADE_SELECIONADA,
            observacao: observacao,
            opcionais: OPCIONAIS_SELECIONADOS,
        })

        // seta o produto no localstorage
        app.method.gravarValorSessao(JSON.stringify(cart), 'cart');

        app.method.mensagem("Item adicionado ao carrinho.", "green");

        setTimeout(() => {
            // redireciona o usuário para a tela inicial do cardápio
            window.location.href = '/index.html';
        }, 1500);

       

    },

}

item.template = {

    opcional: `
        <div class="container-group mb-5" data-minimo="\${minimo}" data-maximo="\${maximo}" id="opcional-\${idopcional}">
            \${obrigatorio}
            <p class="title-categoria mb-0"><b>\${titulo}</b></p>
            <span class="sub-title-categoria">\${sub-titulo}</span>
            \${itens}
        </div>
    `,

    opcionalItem: `
        <div class="card card-opcionais mt-2">
            <div class="infos-produto-opcional">
                <p class="name mb-0"><b>\${nome}</b></p>
                <p class="price mb-0"><b>\${valor}</b></p>
            </div>
            <div class="checks">
                <label class="container-check">
                    <input id="check-opcional-\${idopcionalitem}" type="checkbox" class="paiopcional-\${idopcional}" onchange="item.method.selecionarOpcional('\${idopcionalitem}', \${idopcional})">
                    <span class="checkmark"></span>
                </label>
            </div>
        </div>
    `,

    opcionalItemSimples: `
        <div class="card card-opcionais mt-2">
            <div class="infos-produto-opcional">
                <p class="name mb-0"><b>\${nome}</b></p>
                <p class="price mb-0"><b>\${valor}</b></p>
            </div>
            <div class="checks">
                <label class="container-check">
                    <input id="check-opcional-\${idopcionalitem}" type="checkbox" onchange="item.method.selecionarOpcionalSimples('\${idopcionalitem}')">
                    <span class="checkmark"></span>
                </label>
            </div>
        </div>
    `,

}