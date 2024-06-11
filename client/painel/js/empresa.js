document.addEventListener("DOMContentLoaded", function (event) {
    empresa.event.init();
});

var empresa = {};
var DADOS_EMPRESA = {};

var MODAL_UPLOAD = new bootstrap.Modal(document.getElementById('modalUpload'));

let DROP_AREA = document.getElementById("drop-area");

empresa.event = {

    init: () => {

        app.method.loading(true);
        app.method.validaToken();
        app.method.carregarDadosEmpresa();

        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        })

        // inicia a primeira Tab
        empresa.method.openTab('sobre');

        // inicializa o drag e drop da imagem

        // Previne os comportamenos padrão do navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.preventDefaults, false)
            document.body.addEventListener(eventName, empresa.method.preventDefaults, false)
        });

        // Evento quando passa o mouse em cima com a imagem segurada (Hover)
        ['dragenter', 'dragover'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.highlight, false)
        });

        // Evento quando sai com o muse de cima
        ['dragleave', 'drop'].forEach(eventName => {
            DROP_AREA.addEventListener(eventName, empresa.method.unhighlight, false)
        });

        // Evento quando solta a imagem no container
        DROP_AREA.addEventListener('drop', empresa.method.handleDrop, false)

        // inicia a mascara no CEP
        $('.cep').mask('00000-000');

    }

}

empresa.method = {

    openTab: (tab) => {

        Array.from(document.querySelectorAll(".tab-content")).forEach(e => e.classList.remove('active'));
        Array.from(document.querySelectorAll(".tab-item")).forEach(e => e.classList.add('hidden'));

        document.querySelector("#tab-" + tab).classList.add('active');
        document.querySelector("#" + tab).classList.remove('hidden');

        switch (tab) {
            case 'sobre':
                empresa.method.obterDados();
                break;

            case 'endereco':
                empresa.method.obterDados();
                break;

            case 'horario':
                empresa.method.obterHorarios();
                break;

            default:
                break;
        }

    },

    // obtem os dados da empresa
    obterDados: () => {

        app.method.loading(true);

        app.method.get('/empresa/sobre',
            (response) => {

                app.method.loading(false);

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                let empresa = response.data[0];

                DADOS_EMPRESA = empresa;

                console.log('empresa', empresa)

                // carrega a TAB sobre

                if (empresa.logotipo != null) {
                    document.getElementById("img-empresa").style.backgroundImage = `url('../public/images/empresa/${empresa.logotipo}')`;
                    document.getElementById("img-empresa").style.backgroundSize = "70%";
                    document.getElementById("btn-remover-logo").classList.remove('hidden');
                    document.getElementById("btn-editar-logo").classList.add('hidden');
                }
                else {
                    document.getElementById("img-empresa").style.backgroundImage = `url('../public/images/empresa/default.jpg')`;
                    document.getElementById("img-empresa").style.backgroundSize = "cover";
                    document.getElementById("btn-remover-logo").classList.add('hidden');
                    document.getElementById("btn-editar-logo").classList.remove('hidden');
                }

                document.getElementById("txtNomeEmpresa").value = empresa.nome;
                document.getElementById("txtSobreEmpresa").innerHTML = empresa.sobre.replace(/\n/g, '\r\n');

                // carrega a TAB endereço

                document.getElementById("txtCEP").value = empresa.cep;
                document.getElementById("txtEndereco").value = empresa.endereco;
                document.getElementById("txtBairro").value = empresa.bairro;
                document.getElementById("txtNumero").value = empresa.numero;
                document.getElementById("txtCidade").value = empresa.cidade;
                document.getElementById("txtComplemento").value = empresa.complemento;
                document.getElementById("ddlUf").value = empresa.estado;

            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // valida os campos e salva os dados da empresa (TAB sobre)
    salvarDadosSobre: () => {

        let nome = document.getElementById("txtNomeEmpresa").value.trim();
        let sobre = document.getElementById("txtSobreEmpresa").value.trim();

        if (nome.length <= 0) {
            app.method.mensagem('Informe o nome da empresa, por favor.');
            document.getElementById("txtNomeEmpresa").focus();
            return;
        }

        let dados = {
            nome: nome,
            sobre: sobre
        }

        app.method.loading(true);

        app.method.post('/empresa/sobre', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // atualiza o localStorage
                app.method.gravarValorSessao(nome, "Nome");

                empresa.method.obterDados();
                app.method.carregarDadosEmpresa();
            },
            (error) => {
                app.method.loading(false);
                console.log('error', error)
            }
        )

    },

    // adiciona a nova logotipo da empresa
    uploadLogo: (logoUpload = []) => {

        MODAL_UPLOAD.hide();

        var formData = new FormData();

        if (logoUpload != undefined) {
            formData.append('image', logoUpload[0]);
        }
        else {
            formData.append('image', document.querySelector('#fileElem').files[0]);
        }

        app.method.loading(true);

        app.method.upload('/image/logo/upload', formData,
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                // atualiza o localStorage
                app.method.gravarValorSessao(response.logotipo, "Logo");

                empresa.method.obterDados();
                app.method.carregarDadosEmpresa();
            },
            (xhr, ajaxOptions, error) => {
                app.method.loading(false);
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }
        )

    },

    // remove o logotipo da empresa
    removeLogo: () => {

        var data = {
            imagem: DADOS_EMPRESA.logotipo
        }

        app.method.loading(true);

        app.method.post('/image/logo/remove', JSON.stringify(data),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                app.method.removerSessao('Logo');

                empresa.method.obterDados();
                app.method.carregarDadosEmpresa();
            },
            (xhr, ajaxOptions, error) => {
                app.method.loading(false);
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }
        )

    },

    // abre a modal de adicionar logo
    openModalLogo: () => {

        MODAL_UPLOAD.show();

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

        console.log('files', files)
        empresa.method.uploadLogo(files)
    },

    // API ViaCEP
    buscarCep: () => {

        // cria a variavel com o valor do cep
        var cep = document.getElementById("txtCEP").value.trim().replace(/\D/g, '');

        // verifica se o CEP possui valor informado
        if (cep != "") {

            // Expressão regular para validar o CEP
            var validacep = /^[0-9]{8}$/;

            if (validacep.test(cep)) {

                //Cria um elemento javascript.
                var script = document.createElement('script');

                //Sincroniza com o callback.
                script.src = 'https://viacep.com.br/ws/' + cep + '/json/?callback=empresa.method.callbackCep';

                //Insere script no documento e carrega o conteúdo.
                document.body.appendChild(script);

            }
            else {
                app.method.mensagem('Formato do CEP inválido.');
                document.getElementById("txtCEP").focus();
            }

        }
        else {
            app.method.mensagem('Informe o CEP, por favor.');
            document.getElementById("txtCEP").focus();
        }

    },

    // método chamado quando retorna algo da API de CEP
    callbackCep: (dados) => {

        if (!("erro" in dados)) {

            // Atualizar os campos com os valores retornados
            document.getElementById("txtEndereco").value = dados.logradouro;
            document.getElementById("txtBairro").value = dados.bairro;
            document.getElementById("txtCidade").value = dados.localidade;
            document.getElementById("ddlUf").value = dados.uf;
            document.getElementById("txtNumero").focus();

        }
        else {
            app.method.mensagem('CEP não encontrado. Preencha as informações manualmente.');
            document.getElementById("#txtEndereco").focus();
        }

    },

    // valida os campos e salva os dados da empresa (TAB Endereço)
    salvarDadosEndereco: () => {

        let cep = document.getElementById("txtCEP").value.trim();
        let endereco = document.getElementById("txtEndereco").value.trim();
        let bairro = document.getElementById("txtBairro").value.trim();
        let cidade = document.getElementById("txtCidade").value.trim();
        let uf = document.getElementById("ddlUf").value.trim();
        let numero = document.getElementById("txtNumero").value.trim();
        let complemento = document.getElementById("txtComplemento").value.trim();

        if (cep.length <= 0) {
            app.method.mensagem('Informe o CEP, por favor.');
            document.getElementById("txtCEP").focus();
            return;
        }

        if (endereco.length <= 0) {
            app.method.mensagem('Informe o Endereço, por favor.');
            document.getElementById("txtEndereco").focus();
            return;
        }

        if (bairro.length <= 0) {
            app.method.mensagem('Informe o Bairro, por favor.');
            document.getElementById("txtBairro").focus();
            return;
        }

        if (cidade.length <= 0) {
            app.method.mensagem('Informe a Cidade, por favor.');
            document.getElementById("txtCidade").focus();
            return;
        }

        if (uf == "-1") {
            app.method.mensagem('Informe a UF, por favor.');
            document.getElementById("ddlUf").focus();
            return;
        }

        if (numero.length <= 0) {
            app.method.mensagem('Informe o Número, por favor.');
            document.getElementById("txtNumero").focus();
            return;
        }

        let dados = {
            cep: cep,
            endereco: endereco,
            bairro: bairro,
            cidade: cidade,
            estado: uf,
            numero: numero,
            complemento: complemento
        }

        app.method.loading(true);

        app.method.post('/empresa/endereco', JSON.stringify(dados),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                empresa.method.obterDados();
            },
            (xhr, ajaxOptions, error) => {
                app.method.loading(false);
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }
        )

    },

    // obtem os horários da empresa
    obterHorarios: () => {

        document.getElementById("listaHorarios").innerHTML = '';

        app.method.get('/empresa/horario',
            (response) => {

                if (response.status == "error") {
                    console.log(response.message)
                    return;
                }

                empresa.method.carregarHorarios(response.data)

            },
            (error) => {
                console.log('error', error)
            }
        )

    },

    // carrega os horarios na tela
    carregarHorarios: (lista) => {

        if (lista.length > 0) {

            // percorre os horários e adiciona na tela
            lista.forEach((e, i) => {

                // cria um ID aleatorio
                let id = Math.floor(Date.now() * Math.random()).toString();

                let temp = empresa.template.horario.replace(/\${id}/g, id)

                let htmlObject = document.createElement('div');
                htmlObject.classList.add('row', 'horario', 'mb-4');
                htmlObject.id = `horario-${id}`;
                htmlObject.innerHTML = temp;

                // adiciona o horario na tela
                document.getElementById("listaHorarios").appendChild(htmlObject);

                // deixa um delay para depois inserir os valores na tela
                setTimeout(() => {
                    document.querySelector(`#horario-${id} .diainicio`).value = e.diainicio;
                    document.querySelector(`#horario-${id} .diafim`).value = e.diafim;
                    document.querySelector(`#horario-${id} .iniciohorarioum`).value = e.iniciohorarioum;
                    document.querySelector(`#horario-${id} .fimhorarioum`).value = e.fimhorarioum;
                    document.querySelector(`#horario-${id} .iniciohorariodois`).value = e.iniciohorariodois;
                    document.querySelector(`#horario-${id} .fimhorariodois`).value = e.fimhorariodois;
                }, 200);

            })

        }
        else {

            // nenhum horário encontrado, adiciona uma linha em branco
            empresa.method.adicionarHorario();

        }

    },

    // remover linha do horário
    removerHorario: (id) => {
        document.getElementById(`horario-${id}`).remove();
    },

    // adiciona uma linha no horário
    adicionarHorario: () => {

        let adicionar = true;

        // primeiro valida se tem alguma linha sem registros;
        document.querySelectorAll('#listaHorarios .horario').forEach((e, i) => {
            let _id = e.id.split('-')[1];

            let diainicio = document.querySelector('#diainicio-' + _id).value;
            let diafim = document.querySelector('#diafim-' + _id).value;
            let iniciohorarioum = document.querySelector('#iniciohorarioum-' + _id).value;
            let fimhorarioum = document.querySelector('#fimhorarioum-' + _id).value;

            if (diainicio <= -1 || diafim <= -1 || iniciohorarioum.length <= 0 || fimhorarioum.length <= 0) {
                adicionar = false;
                app.method.mensagem('Antes de adicionar outra linha, verifique se não existem linhas em branco')
            }

        });

        if (!adicionar) {
            return;
        }

        let id = Math.floor(Date.now() * Math.random()).toString();

        let temp = empresa.template.horario.replace(/\${id}/g, id);

        var htmlObject = document.createElement('div');
        htmlObject.classList.add('row', 'horario', 'mb-4');
        htmlObject.id = `horario-${id}`;
        htmlObject.innerHTML = temp;

        // adiciona o horario na tela
        document.getElementById("listaHorarios").appendChild(htmlObject);

    },

    // valida os campos e salva os horários
    salvarHorarios: () => {

        let _horarios = [];
        let continuar = true;

        // primeiro valida se tem alguma linha sem registros;
        document.querySelectorAll('#listaHorarios .horario').forEach((e, i) => {
            let _id = e.id.split('-')[1];

            let diainicio = document.querySelector('#diainicio-' + _id).value;
            let diafim = document.querySelector('#diafim-' + _id).value;
            let iniciohorarioum = document.querySelector('#iniciohorarioum-' + _id).value;
            let fimhorarioum = document.querySelector('#fimhorarioum-' + _id).value;
            let iniciohorariodois = document.querySelector('#iniciohorariodois-' + _id).value;
            let fimhorariodois = document.querySelector('#fimhorariodois-' + _id).value;

            // valida os campos obrigatórios
            if (diainicio <= -1 || diafim <= -1 || iniciohorarioum.length <= 0 || fimhorarioum.length <= 0) {
                continuar = false;
                app.method.mensagem('Alguns campos obrigatórios não foram preenchidos.');
            }

            _horarios.push({
                diainicio: diainicio,
                diafim: diafim,
                iniciohorarioum: iniciohorarioum,
                fimhorarioum: fimhorarioum,
                iniciohorariodois: iniciohorariodois,
                fimhorariodois: fimhorariodois
            })

        });

        if (!continuar || _horarios.length <= 0) {
            return;
        }

        console.log('_horarios', _horarios);

        app.method.loading(true);

        app.method.post('/empresa/horario', JSON.stringify(_horarios),
            (response) => {
                console.log(response)

                app.method.loading(false);

                if (response.status === 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                app.method.mensagem(response.message, 'green');

                empresa.method.openTab('horario');
            },
            (xhr, ajaxOptions, error) => {
                app.method.loading(false);
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }
        )

    },

}

empresa.template = {

    horario: `

        <div class="col-2">
            <div class="form-group">
                <p class="title-categoria mb-0"><b>De:*</b></p>
                <select class="form-control diainicio" id="diainicio-\${id}">
                    <option value="-1">...</option>
                    <option value="0">Domingo</option>
                    <option value="1">Segunda</option>
                    <option value="2">Terça</option>
                    <option value="3">Quarta</option>
                    <option value="4">Quinta</option>
                    <option value="5">Sexta</option>
                    <option value="6">Sábado</option>
                </select>
            </div>
        </div>

        <div class="col-2">
            <div class="form-group">
                <p class="title-categoria mb-0"><b>até:*</b></p>
                <select class="form-control diafim" id="diafim-\${id}">
                    <option value="-1">...</option>
                    <option value="0">Domingo</option>
                    <option value="1">Segunda</option>
                    <option value="2">Terça</option>
                    <option value="3">Quarta</option>
                    <option value="4">Quinta</option>
                    <option value="5">Sexta</option>
                    <option value="6">Sábado</option>
                </select>
            </div>
        </div>
        
        <div class="col-7">
            <div class="row">
                <div class="col-3">
                    <div class="form-group">
                        <p class="title-categoria mb-0"><b>das:*</b></p>
                        <input type="time" class="form-control iniciohorarioum" id="iniciohorarioum-\${id}"/>
                    </div>
                </div>
                <div class="col-3">
                    <div class="form-group">
                        <p class="title-categoria mb-0"><b>até as:*</b></p>
                        <input type="time" class="form-control fimhorarioum" id="fimhorarioum-\${id}"/>
                    </div>
                </div>
                <div class="col-3">
                    <div class="form-group">
                        <p class="title-categoria mb-0"><b>e das:</b></p>
                        <input type="time" class="form-control iniciohorariodois" id="iniciohorariodois-\${id}"/>
                    </div>
                </div>
                <div class="col-3">
                    <div class="form-group">
                        <p class="title-categoria mb-0"><b>até as:</b></p>
                        <input type="time" class="form-control fimhorariodois" id="fimhorariodois-\${id}"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-1 mt-2">
            <a class="btn btn-red btn-sm mt-4" onclick="empresa.method.removerHorario('\${id}')">
                <i class="fas fa-trash-alt"></i> 
            </a>
        </div>
    `

}
