var app = {};

app.event = {

    init: (home = false) => {

        app.method.validarEmpresaAberta(home);

    }

}

app.method = {

    // centraliza as chamadas de get
    get: (url, callbackSuccess, callbackError, login = false) => {

        try {
            if (app.method.validaToken(login)) {

                let xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.setRequestHeader("Content-Type", 'application/json;charset=utf-8');
                xhr.setRequestHeader("Authorization", app.method.obterValorSessao('token'));

                xhr.onreadystatechange = function () {
                    
                    if (this.readyState == 4) {

                        if (this.status == 200) {
                            return callbackSuccess(JSON.parse(xhr.responseText))
                        }
                        else {
    
                            // se o retorno for não autorizado, redireciona o usuário para o login
                            if (xhr.status == 401) app.method.logout();
    
                            return callbackError(xhr.responseText);
                        } 

                    } 
                    
                }

                xhr.send();

            }
        }
        catch (ex) {
            return callbackError(ex);
        }

    },

    // centraliza as chamadas de post
    post: (url, dados, callbackSuccess, callbackError, login = false) => {

        try {
            if (app.method.validaToken(login)) {

                let xhr = new XMLHttpRequest();
                xhr.open('POST', url);
                xhr.setRequestHeader("Content-Type", 'application/json;charset=utf-8');
                xhr.setRequestHeader("Authorization", app.method.obterValorSessao('token'));

                xhr.onreadystatechange = function () {
                    
                    if (this.readyState == 4) {

                        if (this.status == 200) {
                            return callbackSuccess(JSON.parse(xhr.responseText))
                        }
                        else {
    
                            // se o retorno for não autorizado, redireciona o usuário para o login
                            if (xhr.status == 401) app.method.logout();
    
                            return callbackError(xhr.responseText);
                        } 

                    } 
                    
                }

                xhr.send(dados);

            }
        }
        catch (ex) {
            return callbackError(ex);
        }

    },

    // centraliza as chamadas de post
    upload: (url, dados, callbackSuccess, callbackError, login = false) => {

        try {
            if (app.method.validaToken(login)) {

                // document.querySelector.ajax({
                //     url: url,
                //     method: 'POST',
                //     processData: false,
                //     contentType: false,
                //     data: dados,
                //     mimeType: 'multipart/form-data',
                //     async: true,
                //     crossDomain: true,
                //     beforeSend: (request) => { request.setRequestHeader("authorization", app.method.obterValorSessao('token')); },
                //     success: (response) => callbackSuccess(JSON.parse(response)),
                //     error: (xhr, ajaxOptions, error) => {

                //         // se o retorno for não autorizado, redireciona o usuário para o login
                //         if (xhr.status == 401) app.method.logout();

                //         callbackError(xhr, ajaxOptions, error)
                //     },
                // });

                let xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.setRequestHeader("Mime-Type", 'multipart/form-data');
                xhr.setRequestHeader("Authorization", app.method.obterValorSessao('token'));

                xhr.onreadystatechange = function () {
                    
                    if (this.readyState == 4) {

                        if (this.status == 200) {
                            return callbackSuccess(JSON.parse(xhr.responseText))
                        }
                        else {
    
                            // se o retorno for não autorizado, redireciona o usuário para o login
                            if (xhr.status == 401) app.method.logout();
    
                            return callbackError(xhr.responseText);
                        } 

                    } 
                    
                }

                xhr.send(dados);

            }
        }
        catch (ex) {
            return callbackError(ex);
        }

    },

    // método para validar se o token existe. É chamado em todas as requisições internas
    validaToken: (login = false) => {

        var tokenAtual = app.method.obterValorSessao('token');

        if ((tokenAtual == undefined || tokenAtual == null || tokenAtual == "" || tokenAtual == 'null') && !login) {
            window.location.href = '/painel/login.html';
            return false;
        }

        return true;
    },

    // grava o token no localstorage
    gravarValorSessao: (valor, local) => {
        localStorage[local] = valor;
    },

    // retorna o token atual
    obterValorSessao: (local) => {

        // Valores Sessão -> [token] [nomeUsuario]
        return localStorage[local];

    },

    // remove uma sessao 
    removerSessao: (local) => {
        localStorage.removeItem(local);
    },

    // método que limpa toda o localStorage e redireciona para o login
    logout: () => {
        localStorage.clear();
        window.location.href = '/painel/login.html';
    },

    // método genérico para mensagens
    mensagem: (texto, cor = 'red', tempo = 3500) => {

        let container = document.querySelector('#container-mensagens');

        // Travar até 3 mensagens
        if (container.childElementCount === 3) {
            return;
        }
        
        let id = Math.floor(Date.now() * Math.random()).toString();

        let msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`;

        container.innerHTML += msg;

        setTimeout(() => {
            document.querySelector(`#msg-${id}`).classList.remove('fadeInDown');
            document.querySelector(`#msg-${id}`).classList.add('fadeOutUp');
            setTimeout(() => {
                document.querySelector(`#msg-${id}`).remove();
            }, 800);
        }, tempo);

    },

    // método que exibe o loader
    loading: (running = false) => {

        if (running) {
            document.querySelector(".loader-full").classList.remove('hidden');
        }
        else {
            document.querySelector(".loader-full").classList.add('hidden');
        }

    },

    // valida se a empresa está aberta
    validarEmpresaAberta: (home = false) => {

        app.method.loading(true);

        app.method.get('/empresa/open',
            (response) => {

                app.method.loading(false);

                // Se estiver na tela principal do cardápio
                if (home) {
                    document.querySelector(".status-open").classList.remove('hidden');
                }

                if (response.status == "error") {

                    // Altera o label de Aberto/Fechado (se estiver na tela principal do cardápio)
                    if (home) {
                        document.querySelector(".status-open").classList.add('closed');
                        document.querySelector("#lblLojaAberta").innerText = 'Fechado';
                    }

                    // Exibe o menu de loja fechada
                    document.querySelector("#menu-bottom").remove();
                    document.querySelector("#menu-bottom-closed").classList.remove('hidden');
                    return;
                }

                // Se estiver na tela principal do cardápio
                if (home) {
                    document.querySelector(".status-open").classList.remove('closed');
                    document.querySelector("#lblLojaAberta").innerText = 'Aberto';
                }
                
                document.querySelector("#menu-bottom").classList.remove('hidden');
                document.querySelector("#menu-bottom-closed").remove();

            },
            (xhr, ajaxOptions, error) => {
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }, true
        )

    },

    // carregar empresa
    carregarDadosEmpresa: () => {

        document.querySelector(".nome-empresa").innerHTML = app.method.obterValorSessao('Nome');
        document.querySelector(".email-empresa").innerHTML = app.method.obterValorSessao('Email');

        let logotipo = app.method.obterValorSessao('Logo');
        if (logotipo != undefined && logotipo != null && logotipo != '') {
            document.querySelector(".logo-empresa").src = '/public/images/empresa/' + logotipo;
        }
        else {
            document.querySelector(".logo-empresa").src = '/public/images/empresa/default.jpg';
        }
        

    },

    // cria um id aleatório
    criarGuid: () => {
        return "00000000-0000-0000-0000-000000000000".replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

}
