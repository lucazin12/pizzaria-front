document.addEventListener("DOMContentLoaded", function (event) {
    login.event.init();
});

var login = {};

login.event = {

    init: () => {

        document.querySelector("#btnLogin").onclick = () => {
            login.method.validaLogin();
        }

    }

}

login.method = {

    validaLogin: () => {

        let email = document.querySelector("#txtEmailLogin").value.trim();
        let senha = document.querySelector("#txtSenhaLogin").value.trim();

        if (email.length == 0) {
            app.method.mensagem("Informe o E-mail, por favor", 'red', 3000);
            document.querySelector("#txtEmailLogin").focus();
            return;
        }

        if (senha.length == 0) {
            app.method.mensagem("Informe a Senha, por favor", 'red', 3000);
            document.querySelector("#txtSenhaLogin").focus();
            return;
        }

        login.method.login(email, senha);

    },

    login: (email, senha) => {

        var dados = {
            email: email,
            senha: senha
        }

        app.method.post('/login', JSON.stringify(dados),
            (response) => {
                console.log(response)

                if (response.status == 'error') {
                    app.method.mensagem(response.message);
                    return;
                }

                if (response.status == "success") {

                    app.method.gravarValorSessao(response.TokenAcesso, "token")
                    app.method.gravarValorSessao(response.Nome, "Nome")
                    app.method.gravarValorSessao(response.Email, "Email")
                    app.method.gravarValorSessao(response.Logo, "Logo")

                    window.location.href = '/painel/home.html';

                }

            },
            (xhr, ajaxOptions, error) => {
                console.log('xhr', xhr)
                console.log('ajaxOptions', ajaxOptions)
                console.log('error', error)
            }, true
        )

    }

}

