$(document).ready(function () {
    cardapio.event.init();
})

var cardapio = {};

var CATEGORIAS = [];
var PRODUTOS = [];

var CATEGORIA_ID = 0;
var PRODUTO_ID = 0;

var OPCIONAL_ITEM_ID = 0;

let DROP_AREA = document.getElementById("drop-area");

cardapio.event = {

    init: () => {

        app.method.validaToken();
        app.method.carregarDadosEmpresa();

        $("#categoriasMenu").sortable({
            scroll: false, // para não scrollar a tela
            update: function (event, ui) {
                // função para atualizar a ordem da lista
                cardapio.method.atualizarOrdemCategorias();
            },
            handle: ".drag-icon" // define a classe que pode receber o "drag and drop"
        });

        // máscara para o campo de valor
        $('.money').mask('#.##0,00', { reverse: true });

        cardapio.method.carregarListaIcones();
        cardapio.method.obterCategorias();


        // inicializa o drag e drop da imagem
        // Previne os comportamenos padrão do navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, cardapio.method.preventDefaults, false)
            document.body.addEventListener(eventName, cardapio.method.preventDefaults, false)
        });

        // Evento quando passa o mouse em cima com a imagem segurada (Hover)
        ['dragenter', 'dragover'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, cardapio.method.highlight, false)
        });

        // Evento quando sai com o muse de cima
        ['dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, cardapio.method.unhighlight, false)
        });

        // Evento quando solta a imagem no container
        DROP_AREA.addEventListener('drop', cardapio.method.handleDrop, false)

    }

}

cardapio.method = {

    // obtem a lista de categorias
    obterCategorias: () => {

        app.method.loading(true);
        document.getElementById("categoriasMenu").innerHTML = '';

        CATEGORIAS = [];

        app.method.get('/categoria',
            (response) => {
                console.log('response', response);
                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                // passa a lista das categorias para a variavel global
                CATEGORIAS = response.data;

                cardapio.method.carregarCategorias(response.data)
            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        );
    },

    // carrega as categorias na tela
    carregarCategorias: (lista) => {

        if (lista.length > 0) {

            // percorre as categorias e adiciona na tela
            lista.forEach((e, i) => {

                let icone = ICONES.filter((elem) => { return elem.name === e.icone });

                console.log('icone', icone)

                let temp = cardapio.template.categoria.replace(/\${id}/g, e.idcategoria)
                    .replace(/\${titulo}/g, e.nome)
                    .replace(/\${icone}/g, icone[0].icon)

                // adiciona a categoria na tela
                document.querySelector("#categoriasMenu").innerHTML += temp;

                // último item, inicia o evento de tooltip
                if ((i + 1) == lista.length) {

                    $('[data-toggle="tooltip"]').tooltip();

                }

            })

        }
        else {
            // nenhuma categoria encontrada, adiciona uma linha em branco
        }

    },

    // método que atualiza a ordem das categorias
    atualizarOrdemCategorias: () => {

        let categorias = []

        let listacategorias = $("#categoriasMenu > .card");

        $.each(listacategorias, (i, e) => {

            let idcategoria = $(e).attr('data-idcategoria');

            categorias.push({
                idcategoria: idcategoria,
                ordem: i + 1
            })

            // último item, manda as informações para a API
            if ((i + 1) == listacategorias.length) {

                app.method.loading(true);

                app.method.post('/categoria/ordenar', JSON.stringify(categorias),
                    (response) => {
                        console.log(response)

                        app.method.loading(false);

                        if (response.status === 'error') {
                            app.method.mensagem(response.message);
                            return;
                        }

                        app.method.mensagem(response.message, 'green');

                    },
                    (error) => {
                        app.method.loading(false);
                        console.log('error', error)
                    }
                )

            }

        })

    },

    // carrega a lista dos icones da categoria (modal form)
    carregarListaIcones: () => {

        $.each(ICONES, (i, e) => {
            $("#ddlIconeCategoria").append(`<option value="${e.name}">${e.unicode}</option>`);
        })

    },

    // obtem os produtos quando clica para expardir a categoria
    obterProdutosCategoria: (idcategoria, forcar = false) => {

        // valida se já existe conteudo dentro do elemento
        let conteudo = document.getElementById("listaProdutos-" + idcategoria).children.length;

        if (conteudo <= 0 || forcar) {

            document.getElementById("listaProdutos-" + idcategoria).innerHTML = '';

            // caso não exista conteúdo, obtem os produtos da categoria

            PRODUTOS[idcategoria] = [];

            app.method.loading(true);

            app.method.get('/produto/categoria/' + idcategoria,
                (response) => {
                    console.log('response', response);
                    app.method.loading(false);

                    if (response.status == "error") {
                        console.log(response.message)
                        return;
                    }

                    PRODUTOS[idcategoria] = response.data;

                    cardapio.method.carregarProdutos(response.data, idcategoria)
                },
                (error) => {
                    app.method.loading(false);
                    console.log('error', error)
                }
            );

        }

    },

    // carrega os produtos dentro da categoria
    carregarProdutos: (lista, idcategoria) => {

        if (lista.length > 0) {

            // percorre as categorias e adiciona na tela
            lista.forEach((e, i) => {

                let imagem = `style="background-image: url('/public/images/${e.imagem}'); background-size: cover;"`;

                let btnEditar = 'hidden';
                let btnRemover = 'hidden';

                if (e.imagem == null) {

                    imagem = `style="background-image: url('/public/images/default.jpg'); background-size: cover;"`;

                    // deixa o botão de Editar imagem visivel
                    btnEditar = '';
                }
                else {
                    // deixa o botão de Remover Imagem visivel 
                    btnRemover = '';
                }

                let temp = cardapio.template.produto.replace(/\${id}/g, e.idproduto)
                    .replace(/\${imagem}/g, imagem)
                    .replace(/\${nome}/g, e.nome)
                    .replace(/\${descricao}/g, e.descricao)
                    .replace(/\${preco}/g, e.valor.toFixed(2).replace('.', ','))
                    .replace(/\${idcategoria}/g, idcategoria)
                    .replace(/\${btnEditar}/g, btnEditar)
                    .replace(/\${btnRemover}/g, btnRemover)
                    .replace(/\${opcionais}/g, e.opcionais > 0 ? `<span class="badge-adicionais">${e.opcionais}</span>` : '');

                document.querySelector("#listaProdutos-" + idcategoria).innerHTML += temp;


                // último item, inicia o evento de drag
                if ((i + 1) == lista.length) {

                    // incia o tooltip
                    $('[data-toggle="tooltip"]').tooltip();

                    $("#listaProdutos-" + idcategoria).sortable({
                        scroll: false, // para não scrollar a tela
                        update: function (event, ui) {
                            // função para atualizar a ordem da lista
                            cardapio.method.atualizarOrdemProdutos(idcategoria);
                        },
                        handle: ".drag-icon-produto" // define a classe que pode receber o "drag and drop"
                    });

                }

            })

        }
        else {
            // nenhum produto encontrado
        }

    },

    // método para abrir a modal de adicionar nova categoria
    abrirModalAdicionarCategoria: () => {

        CATEGORIA_ID = 0;

        // limpa os campos
        $("#ddlIconeCategoria").val('-1');
        $("#txtNomeCategoria").val('');

        // abre a modal
        $('#modalCategoria').modal({ backdrop: 'static' });
        $('#modalCategoria').modal('show');

    },

    // abre a modal de confirmação para duplicar
    abrirModalDuplicarCategoria: (idcategoria) => {

        // seta a categoria selecionada
        CATEGORIA_ID = idcategoria;

        // abre a modal
        $('#modalDuplicarCategoria').modal('show');

    },

    // abre a modal de confirmação para duplicar
    abrirModalRemoverCategoria: (idcategoria) => {

        // seta a categoria selecionada
        CATEGORIA_ID = idcategoria;

        // abre a modal
        $('#modalRemoverCategoria').modal('show');

    },

    // método para abrir a modal de editar a categoria
    editarCategoria: (idcategoria) => {

        // seta a categoria selecionada, pra depois atualizar ela
        CATEGORIA_ID = idcategoria;

        let categoria = CATEGORIAS.filter((e) => { return e.idcategoria == idcategoria });

        // se existir a categoria, abre a modal
        if (categoria.length > 0) {

            // altera os campos da modal
            $("#ddlIconeCategoria").val(categoria[0].icone);
            $("#txtNomeCategoria").val(categoria[0].nome);

            // abre a modal
            $('#modalCategoria').modal({ backdrop: 'static' });
            $('#modalCategoria').modal('show');

        }

    },

    // método para confirmar o cadastro / edição da categoria
    salvarCategoria: () => {

        // valida os campos

        let icone = $("#ddlIconeCategoria").val();
        let nome = $("#txtNomeCategoria").val().trim();

        if (icone == "-1") {
            app.method.mensagem("Selecione o ícone da categoria, por favor.")
            return;
        }

        if (nome.length <= 0) {
            app.method.mensagem("Informe o nome da categoria, por favor.")
            return;
        }

        let dados = {
            idcategoria: CATEGORIA_ID,
            nome: nome,
            icone: icone
        }

        app.method.loading(true);

        app.method.post('/categoria', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalCategoria').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                cardapio.method.obterCategorias();
            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // método para duplicar a categoria
    duplicarCategoria: () => {

        let idcategoria = CATEGORIA_ID;

        var dados = {
            idcategoria: idcategoria
        }

        app.method.loading(true);

        app.method.post('/categoria/duplicar', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalDuplicarCategoria').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                cardapio.method.obterCategorias();

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // método para remover a categoria
    removerCategoria: () => {

        let idcategoria = CATEGORIA_ID;

        var dados = {
            idcategoria: idcategoria
        }

        app.method.loading(true);

        app.method.post('/categoria/remover', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalRemoverCategoria').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                cardapio.method.obterCategorias();

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // PRODUTO --------

    // método que atualiza a ordem dos produtos
    atualizarOrdemProdutos: (idcategoria) => {

        let produtos = []

        let listaprodutos = $("#listaProdutos-" + idcategoria + " > .card");

        console.log('listaprodutos', listaprodutos)

        $.each(listaprodutos, (i, e) => {

            let idproduto = $(e).attr('data-idproduto');

            produtos.push({
                idproduto: idproduto,
                ordem: i + 1
            })

            // último item, manda as informações para a API
            if ((i + 1) == listaprodutos.length) {

                app.method.loading(true);

                app.method.post('/produto/ordenar', JSON.stringify(produtos),
                    (response) => {
                        console.log(response)

                        app.method.loading(false);

                        if (response.status === 'error') {
                            app.method.mensagem(response.message);
                            return;
                        }

                        app.method.mensagem(response.message, 'green');

                    },
                    (error) => {
                        app.method.loading(false);
                        console.log('error', error)
                    }
                )

            }

        })

    },

    // método para abrir a modal de adicionar novo produto
    abrirModalAdicionarProduto: (idcategoria) => {

        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = 0;

        // limpa os campos
        $("#txtNomeProduto").val('');
        $("#txtPrecoProduto").val('');
        $("#txtDescricaoProduto").val('');

        // abre a modal
        $('#modalProduto').modal({ backdrop: 'static' });
        $('#modalProduto').modal('show');

    },

    // abre a modal de confirmação para duplicar
    abrirModalDuplicarProduto: (idcategoria, idproduto) => {

        // seta o produto selecionado
        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        // abre a modal
        $('#modalDuplicarProduto').modal('show');

    },

    // abre a modal de confirmação para remover
    abrirModalRemoverProduto: (idcategoria, idproduto) => {

        // seta o produto selecionado
        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        // abre a modal
        $('#modalRemoverProduto').modal('show');

    },

    // método para abrir a modal de editar o produto
    editarProduto: (idcategoria, idproduto) => {

        // seta o produto selecionado, pra depois atualizar ele
        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        // obtem o produto da lista global
        let produto = PRODUTOS[idcategoria].filter((e) => { return e.idproduto == idproduto });

        // se existir o produto, abre a modal
        if (produto.length > 0) {

            console.log('produto', produto)

            // altera os campos da modal
            $("#txtNomeProduto").val(produto[0].nome);
            $("#txtPrecoProduto").val((produto[0].valor).toFixed(2).toString().replace('.', ','));
            $("#txtDescricaoProduto").val(produto[0].descricao);

            // abre a modal
            $('#modalProduto').modal({ backdrop: 'static' });
            $('#modalProduto').modal('show');

        }

    },

    // método para confirmar o cadastro / edição do produto
    salvarProduto: () => {

        // valida os campos

        let nome = $("#txtNomeProduto").val().trim();
        let valor = parseFloat($("#txtPrecoProduto").val().replace(/\./g, '').replace(',', '.'));
        let descricao = $("#txtDescricaoProduto").val().trim();

        if (nome.length <= 0) {
            app.method.mensagem("Informe o nome do produto, por favor.")
            return;
        }

        // valida se o valor é um número (se não está vazio) e se é = 0 ou menor
        if (isNaN(valor) || valor <= 0) {
            app.method.mensagem("Informe o valor do produto, por favor.")
            return;
        }

        let dados = {
            idcategoria: CATEGORIA_ID,
            idproduto: PRODUTO_ID,
            nome: nome,
            valor: valor,
            descricao: descricao
        }

        app.method.loading(true);

        app.method.post('/produto', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalProduto').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // força o método de obter os produtos da categoria aberta
                cardapio.method.obterProdutosCategoria(CATEGORIA_ID, true);
            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // método para duplicar o produto
    duplicarProduto: () => {

        let idproduto = PRODUTO_ID;

        var dados = {
            idproduto: idproduto
        }

        app.method.loading(true);

        app.method.post('/produto/duplicar', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalDuplicarProduto').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // força o método de obter os produtos da categoria aberta
                cardapio.method.obterProdutosCategoria(CATEGORIA_ID, true);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // método para remover o produto
    removerProduto: () => {

        let idproduto = PRODUTO_ID;

        var dados = {
            idproduto: idproduto
        }

        app.method.loading(true);

        app.method.post('/produto/remover', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                $('#modalRemoverProduto').modal('hide');

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // força o método de obter os produtos da categoria aberta
                cardapio.method.obterProdutosCategoria(CATEGORIA_ID, true);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // faz o upload da imagem do produto
    uploadImagemProduto: (imagemUpload = []) => {

        $('#modalUpload').modal('hide');

        var formData = new FormData();

        if (imagemUpload != undefined) {
            formData.append('image', imagemUpload[0]);
        }
        else {
            formData.append('image', document.querySelector('#fileElem').files[0]);
        }

        app.method.loading(true);

        app.method.upload('/image/produto/upload/' + PRODUTO_ID, formData,
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // força o método de obter os produtos da categoria aberta
                cardapio.method.obterProdutosCategoria(CATEGORIA_ID, true);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // remove a imagem do produto da empresa
    removerImagemProduto: () => {

        $('#modalRemoverImagemProduto').modal('hide');

        var data = {
            idproduto: PRODUTO_ID
        }

        app.method.loading(true);

        app.method.post('/image/produto/remove', JSON.stringify(data),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // força o método de obter os produtos da categoria aberta
                cardapio.method.obterProdutosCategoria(CATEGORIA_ID, true);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // abre a modal de adicionar imagem do produto
    abrirModalImagemProduto: (idcategoria, idproduto) => {

        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        // limpa o input de imagem
        $('#fileElem').val(null);

        $('#modalUpload').modal('show');

    },

    // abrir a modal de remover a imagem do produto
    abrirModalremoverImagemProduto: (idcategoria, idproduto) => {

        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        $('#modalRemoverImagemProduto').modal('show');

    },

    // DRAG AND DROP - previne os comportamentos padrões
    preventDefaults: (e) => {
        e.preventDefault();
        e.stopPropagation();
    },

    // DRAG AND DROP - adiciona a classe 'highlight' quando entra com a imagem no container
    highlight: (e) => {
        if (!DROP_AREA.classList.contains('highlight')) {
            DROP_AREA.classList.add('highlight');
        }
    },

    // DRAG AND DROP - remove a classe 'highlight' quando sai com a imagem no container
    unhighlight: (e) => {
        DROP_AREA.classList.remove('highlight')
    },

    // DRAG AND DROP - quando soltar a imagem no container
    handleDrop: (e) => {
        var dt = e.dataTransfer
        var files = dt.files
        cardapio.method.uploadImagemProduto(files)
    },

    // OPCIONAIS -------

    // abre a modal de opcionais
    abrirModalOpcionaisProduto: (idcategoria, idproduto) => {

        CATEGORIA_ID = idcategoria;
        PRODUTO_ID = idproduto;

        // limpa a lista de opcionais
        $("#listaOpcionaisProduto").html('');

        // oculta o container de add opcional
        $("#addOpcional").addClass('hidden');

        $('#modalOpcionaisProduto').modal({ backdrop: 'static' });
        $('#modalOpcionaisProduto').modal('show');

        cardapio.method.obterOpcionaisProduto(idproduto);

    },

    // obtem os opcionais do produto
    obterOpcionaisProduto: (idproduto) => {

        app.method.loading(true);

        app.method.get('/opcional/produto/' + idproduto,
            (response) => {
                console.log('response', response);
                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                cardapio.method.carregarOpcionaisProduto(response.data);
                cardapio.method.carregarOpcionaisProdutoSimples(response.data);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        );

    },

    // carrega na modal a lista de opcionais do produto
    carregarOpcionaisProduto: (lista) => {

        if (lista.length > 0) {

            // agrupa o resto pelo titulo (opcionais de seleção)
            let listaSelecao = lista.filter((elem) => { return elem.tiposimples == 0 });
            let listaAgrupada = Object.groupBy(listaSelecao, ({ idopcional }) => idopcional);

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
                    }
                    else {
                        subtitulo = `Escolha 1 opção`;
                        obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
                    }
                }
                if (minimo < maximo) {
                    if (minimo > 0) {
                        subtitulo = `Escolha de ${minimo} até ${maximo} opções`;
                        obrigatorio = `<span class="badge" id="badge-obrigatorio-${e[0]}">Obrigatório</span>`;
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

                    itens += cardapio.template.opcionalItem.replace(/\${idopcionalitem}/g, element.idopcionalitem)
                        .replace(/\${nome}/g, element.nomeopcional)
                        .replace(/\${valor}/g, valor)
                        .replace(/\${idopcional}/g, e[0])
                }

                let temp = cardapio.template.opcional.replace(/\${idopcional}/g, e[0])
                    .replace(/\${obrigatorio}/g, obrigatorio)
                    .replace(/\${titulo}/g, opcional[0].titulo)
                    .replace(/\${sub-titulo}/g, subtitulo)
                    .replace(/\${minimo}/g, minimo)
                    .replace(/\${maximo}/g, maximo)
                    .replace(/\${itens}/g, itens)

                // adiciona a categoria ao menu
                document.querySelector("#listaOpcionaisProduto").innerHTML += temp;

                // último item
                if ((i + 1) == listaAgrupada.length) {

                }

            });

        }

    },

    // carrega na modal a lista de opcionais simples do produto
    carregarOpcionaisProdutoSimples: (lista) => {

        // pega a lista dos opcionais simples
        let listaSimples = lista.filter((elem) => { return elem.tiposimples == 1 });

        if (listaSimples.length > 0) {

            // adiciona o container de opcionais simples
            document.querySelector("#listaOpcionaisProduto").innerHTML += cardapio.template.opcionalSimples;

            listaSimples.forEach((e, i) => {

                let valor = '';

                if (e.valoropcional > 0) {
                    valor = `+ R$ ${(e.valoropcional).toFixed(2).replace('.', ',')}`;
                }

                let temp = cardapio.template.opcionalItemSimples.replace(/\${idopcionalitem}/g, e.idopcionalitem)
                    .replace(/\${nome}/g, e.nomeopcional)
                    .replace(/\${valor}/g, valor)

                document.querySelector("#listaOpcionaisSimples").innerHTML += temp;

            });

        }

    },

    // abre ou fecha o container de adicionar opcional
    abrirModalAddOpcional: () => {

        // fecha a modal de opcionais
        $('#modalOpcionaisProduto').modal('hide');

        // limpa os campos
        $("#container-chkOpcionalSimples").removeClass('hidden');
        $("#container-chkSelecaoOpcoes").addClass('hidden');

        $("#txtNomeSimples").val('');
        $("#txtPrecoSimples").val('');

        $("#txtTituloSecao").val('Deseja borda recheada?');
        $("#txtMinimoOpcao").val(0);
        $("#txtMaximoOpcao").val(1);
        $("#title-opcao-hint").text('Deseja borda recheada?');
        $("#text-opcao-hint").text('Escolha até 1 opção');

        $("#listaOpcoesSelecao").html('');

        $("#chkOpcionalSimples").prop('checked', true);
        $("#chkSelecaoOpcoes").prop('checked', false);

        // abre a modal
        $('#modalAddOpcionalProduto').modal({ backdrop: 'static' });
        $('#modalAddOpcionalProduto').modal('show');


    },

    // seta o chackbox pra opção selecionada
    changeTipoOpcional: (opcao) => {

        // marca a opção selecionada
        $("#chkOpcionalSimples").prop('checked', false);
        $("#chkSelecaoOpcoes").prop('checked', false);
        $("#" + opcao).prop('checked', true);

        // exibe o container da opção selecionada
        $(".container-opcionais").addClass('hidden');
        $("#container-" + opcao).removeClass('hidden');

    },

    // método chamado quando digita algo no campo de Titulo da Seção
    changeTituloSecaoOpcao: () => {

        let texto = $("#txtTituloSecao").val();
        $("#title-opcao-hint").text(texto);

    },

    // método chamado quando aumenta ou dinimui a opção de Minimo e Máximo
    changeMinimoMaximoOpcao: () => {

        let minimo = parseInt($("#txtMinimoOpcao").val());
        let maximo = parseInt($("#txtMaximoOpcao").val());

        console.log('minimo', minimo);
        console.log('maximo', maximo)

        // se não for número, seta o valor pra 0
        if (isNaN(minimo)) {
            $("#txtMinimoOpcao").val(0);
            minimo = 0;
        }
        if (isNaN(maximo)) {
            $("#txtMaximoOpcao").val(0);
            maximo = 0;
        }

        // valida se o mínimo é menor que 0
        if (minimo < 0) {
            $("#txtMinimoOpcao").val(0);
            minimo = 0;
        }
        // valida se o máximo é menor que 1
        if (maximo < 1) {
            $("#txtMaximoOpcao").val(1);
            maximo = 1;
        }

        // valida se o mínimo é maior que o máximo. Se for, seta o mínimo igual ao máximo
        if (minimo > maximo) {
            $("#txtMinimoOpcao").val(maximo);
        }
        // valida se o máximo é menor que o mínimo. Se for, seta o máximo igual ao mínimo
        else if (maximo < minimo) {
            $("#txtMaximoOpcao").val(minimo);
        }

        cardapio.method.atualizarHintOpcao();

    },

    // atualiza o texto que mostra como vai ficar no cardápio
    atualizarHintOpcao: () => {

        let minimo = parseInt($("#txtMinimoOpcao").val());
        let maximo = parseInt($("#txtMaximoOpcao").val());

        let texto = '';

        if (minimo === maximo) {
            if (minimo > 1) {
                texto = `Escolha ${minimo} opções (obrigatório)`;
            }
            else {
                texto = `Escolha 1 opção (obrigatório)`;
            }
        }

        if (minimo < maximo) {
            if (minimo > 0) {
                texto = `Escolha de ${minimo} até ${maximo} opções (obrigatório)`;
            }
            else {
                if (maximo > 1) {
                    texto = `Escolha até ${maximo} opções`;
                }
                else {
                    texto = `Escolha até 1 opção`;
                }

            }
        }

        $("#text-opcao-hint").text(texto);

    },

    // valida os campos para salvar o opcional
    salvarOpcional: () => {

        let simples = $("#chkOpcionalSimples").prop('checked');
        let opcoes = $("#chkSelecaoOpcoes").prop('checked');

        // Se for opcional simples
        if (simples) {

            let nomesimples = $("#txtNomeSimples").val().trim();
            let precosimples = parseFloat($("#txtPrecoSimples").val().replace(/\./g, '').replace(',', '.'));

            if (nomesimples.length <= 0) {
                app.method.mensagem("Informe o nome do opcional, por favor.")
                return;
            }

            // valida se o valor é um número (se não está vazio) e se é = 0 ou menor
            if (isNaN(precosimples) || precosimples <= 0) {
                app.method.mensagem("Informe o valor do opcional, por favor.")
                return;
            }

            var dados = {
                nome: nomesimples,
                valor: precosimples,
                simples: true,
                idproduto: PRODUTO_ID
            }

            cardapio.method.salvarOpcionalProduto(dados);

        }

        // Se for seleção de opções
        if (opcoes) {

            let tituloSecao = $("#txtTituloSecao").val().trim();
            let minimoOpcao = parseInt($("#txtMinimoOpcao").val());
            let maximoOpcao = parseInt($("#txtMaximoOpcao").val());

            if (tituloSecao.length <= 0) {
                app.method.mensagem("Informe o título da seção, por favor.")
                return;
            }

            if (minimoOpcao.length <= 0) {
                app.method.mensagem("Informe o mínimo, por favor.")
                return;
            }

            if (maximoOpcao.length <= 0) {
                app.method.mensagem("Informe o máximo, por favor.")
                return;
            }

            let _opcoes = [];
            let continuar = true;

            // valida se tem alguma linha sem registros;
            document.querySelectorAll('#listaOpcoesSelecao .linha').forEach((e, i) => {
                let _id = e.id.split('-')[1];

                let nomesimples = $('#txtNomeSimples-' + _id).val().trim();
                let precosimples = parseFloat($('#txtPrecoSimples-' + _id).val().replace(/\./g, '').replace(',', '.'));

                // valida os campos obrigatórios
                if (nomesimples.length <= 0 || isNaN(precosimples) || precosimples <= 0) {
                    continuar = false;
                    app.method.mensagem('Alguns campos não foram preenchidos.');
                }

                _opcoes.push({
                    nome: nomesimples,
                    valor: precosimples,
                })

            });

            if (!continuar) {
                return;
            }

            if (_opcoes.length <= 0) {
                app.method.mensagem('Adicione pelo menos 1 opção para continuar.');
                return;
            }

            console.log('_opcoes', _opcoes);

            var dados = {
                titulo: tituloSecao,
                minimoOpcao: minimoOpcao,
                maximoOpcao: maximoOpcao,
                simples: false,
                idproduto: PRODUTO_ID,
                lista: _opcoes
            }

            cardapio.method.salvarOpcionalProduto(dados);

        }


    },

    // método que envia a requisição pra api
    salvarOpcionalProduto: (dados) => {

        app.method.loading(true);

        app.method.post('/opcional/produto', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                $('#modalAddOpcionalProduto').modal('hide');

                cardapio.method.abrirModalOpcionaisProduto(CATEGORIA_ID, PRODUTO_ID);

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // fecha a modal de add opcional e re-abre a modal da lista de opcionais
    fecharModalAddOpcionalProduto: () => {

        $('#modalOpcionaisProduto').modal({ backdrop: 'static' });
        $('#modalOpcionaisProduto').modal('show');

    },

    // abre a modal para remover o opcional item
    abrirModalRemoverOpcionalItem: (idopcionalitem) => {

        OPCIONAL_ITEM_ID = idopcionalitem;
        $('#modalRemoverOpcionalItem').modal('show');

    },

    // remove o opcional item
    removerOpcionalItem: () => {

        if (OPCIONAL_ITEM_ID > 0) {

            var dados = {
                idopcionalitem: OPCIONAL_ITEM_ID
            }

            app.method.post('/opcional/item/remover', JSON.stringify(dados),
                (response) => {
                    console.log(response)

                    app.method.loading(false);

                    if (response.status === 'error') {
                        app.method.mensagem(response.message);
                        return;
                    }

                    app.method.mensagem(response.message, 'green');

                    $('#modalRemoverOpcionalItem').modal('hide');

                    OPCIONAL_ITEM_ID = 0;

                    cardapio.method.abrirModalOpcionaisProduto(CATEGORIA_ID, PRODUTO_ID);

                },
                (error) => {
                    app.method.loading(false);
                    console.log('error', error)
                }
            )

        }

    },

    // adiciona uma linha no opcional de seleção
    adicionarLinhaOpcao: () => {

        // cria um id aleatorio
        let id = Math.floor(Date.now() * Math.random()).toString();

        let temp = cardapio.template.opcaoSelecao.replace(/\${id}/g, id);

        $("#listaOpcoesSelecao").append(temp);

        // máscara para o campo de valor
        $('.money').mask('#.##0,00', { reverse: true });

    },

    // remover linha do opcional
    removerLinhaOpcao: (id) => {
        document.getElementById(`opcao-${id}`).remove();
    },

}

cardapio.template = {

    categoria: `
        <div class="card mt-3" data-idcategoria="\${id}">
            <div class="card-drag" id="heading-\${id}">
                <div class="drag-icon">
                    <i class="fas fa-ellipsis-v"></i>
                    <i class="fas fa-ellipsis-v"></i>
                </div>
                <div class="infos">
                    <a href="#!" class="name mb-0" data-bs-toggle="collapse" data-bs-target="#collapse-\${id}" aria-expanded="true" aria-controls="collapse-\${id}" onclick="cardapio.method.obterProdutosCategoria('\${id}')">
                        <span class="me-2">\${icone}</span>
                        <b>\${titulo}</b>
                    </a>
                </div>
                <div class="actions">
                    <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Editar" onclick="cardapio.method.editarCategoria('\${id}')">
                        <i class="fas fa-pencil-alt"></i>
                    </a>
                    <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Duplicar" onclick="cardapio.method.abrirModalDuplicarCategoria('\${id}')">
                        <i class="far fa-copy"></i>
                    </a>
                    <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Remover" onclick="cardapio.method.abrirModalRemoverCategoria('\${id}')">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </div>
            </div>

            <div id="collapse-\${id}" class="collapse" aria-labelledby="heading-\${id}" data-parent="#categoriasMenu">
                <div class="card-body">
                    <p class="title-produtos mb-0"><b>Produtos</b></p>

                    <div class="lista-produtos" id="listaProdutos-\${id}">

                    </div>

                    <div class="card card-select mt-3" onclick="cardapio.method.abrirModalAdicionarProduto('\${id}')">
                        <div class="infos-produto-opcional">
                            <p class="mb-0 color-primary">
                                <i class="fas fa-plus-circle"></i>&nbsp; Adicionar novo produto
                            </p>
                        </div>
                    </div>

                </div>  
            </div>
        </div>
    `,

    produto: `
    <div class="card mt-3 pl-0" data-idproduto="\${id}">
        <div class="d-flex">
            <div class="drag-icon-produto">
                <i class="fas fa-ellipsis-v"></i>
                <i class="fas fa-ellipsis-v"></i>
            </div>
            <div class="container-img-produto" \${imagem}>
                <a id="btn-remover-imagem-\${id}" onclick="cardapio.method.abrirModalremoverImagemProduto('\${idcategoria}', '\${id}')" href="#!" class="icon-action me-1 mb-1 \${btnRemover}" data-toggle="tooltip" data-placement="top" title="Remover">
                    <i class="fas fa-trash-alt"></i>
                </a>
                <a id="btn-editar-imagem-\${id}" onclick="cardapio.method.abrirModalImagemProduto('\${idcategoria}', '\${id}')" href="#!" class="icon-action me-1 mb-1 \${btnEditar}" data-toggle="tooltip" data-placement="top" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </a>
            </div>
            <div class="infos-produto">
                <p class="name"><b>\${nome}</b></p>
                <p class="description">\${descricao}</p>
                <p class="price"><b>R$ \${preco}</b></p>
            </div>
            <div class="actions">
                <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Opcionais" onclick="cardapio.method.abrirModalOpcionaisProduto('\${idcategoria}', '\${id}')">
                    \${opcionais}
                    <i class="fas fa-layer-group"></i>
                </a>
                <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Editar" onclick="cardapio.method.editarProduto('\${idcategoria}', '\${id}')">
                    <i class="fas fa-pencil-alt"></i>
                </a>
                <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Duplicar" onclick="cardapio.method.abrirModalDuplicarProduto('\${idcategoria}', '\${id}')">
                    <i class="far fa-copy"></i>
                </a>
                <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="Remover" onclick="cardapio.method.abrirModalRemoverProduto('\${idcategoria}', '\${id}')">
                    <i class="fas fa-trash-alt"></i>
                </a>
            </div>
        </div>
    </div>
    `,

    opcaoSelecao: `
        <div class="row linha mt-4" id="opcao-\${id}">
            <div class="col-8">
                <div class="form-group">
                    <p class="title-categoria mb-0"><b>Nome:</b></p>
                    <input id="txtNomeSimples-\${id}" type="text" class="form-control" placeholder="Ex: Bacon" />
                </div>
            </div>

            <div class="col-3">
                <div class="form-group">
                    <p class="title-categoria mb-0"><b>Preço (R$):</b></p>
                    <input id="txtPrecoSimples-\${id}" type="text" class="form-control money" placeholder="0,00" />
                </div>
            </div>

            <div class="col-1">
                <a href="#!" class="btn btn-red btn-sm mt-4" onclick="cardapio.method.removerLinhaOpcao('\${id}')">
                    <i class="fas fa-trash-alt"></i>
                </a>
            </div>
        </div>
    `,

    opcional: `
        <div class="container-group mb-5" data-minimo="\${minimo}" data-maximo="\${maximo}" id="opcional-\${idopcional}">
            \${obrigatorio}
            <p class="title-categoria mb-0"><b>\${titulo}</b></p>
            <span class="sub-title-categoria">\${sub-titulo}</span>
            \${itens}
        </div>
    `,

    opcionalSimples: `
        <section class="opcionais-simples">
            <p class="title-categoria mb-0"><b>Opcionais</b></p>
            <div class="container-group mb-5" id="listaOpcionaisSimples">
                
            </div>
        </section>
    `,

    opcionalItem: `
        <div class="card card-opcionais mt-2">
            <div class="infos-produto-opcional">
                <p class="name mb-0"><b>\${nome}</b></p>
                <p class="price mb-0"><b>\${valor}</b></p>
            </div>
            <div class="checks">
                <div class="actions">
                    <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="" onclick="cardapio.method.abrirModalRemoverOpcionalItem('\${idopcionalitem}')" data-bs-original-title="Remover">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </div>
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
                <div class="actions">
                    <a href="#!" class="icon-action" data-toggle="tooltip" data-placement="top" title="" onclick="cardapio.method.abrirModalRemoverOpcionalItem('\${idopcionalitem}')" data-bs-original-title="Remover">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </div>
            </div>
        </div>
    `,

}