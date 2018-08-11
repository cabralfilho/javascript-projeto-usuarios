class UserController {

    constructor(formIdCreate, formIdUpdate, tableId) {

        this.formEl = document.getElementById(formIdCreate);
        this.formIdUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }

    //método para Editar os dados
    onEdit() {

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {

            this.showPanelCreate();

        });

        this.formIdUpdateEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formIdUpdateEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formIdUpdateEl);

            let index = this.formIdUpdateEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            this.showPanelCreate();

            this.getPhoto(this.formIdUpdateEl).then(
                    (content) => {

                if (!values.photo) {
                    result._photo = userOld._photo;
                } else {
                    result._photo = content;
                }

                tr.dataset.user = JSON.stringify(result);

                tr.innerHTML = `
                <tr>
                    <td><img src="${result._photo}" alt="User Image" class="img-circle img-sm"></td>
                    <td>${result._name}</td>
                    <td>${result._email}</td>
                    <td>${(result._admin) ? 'Sim' : 'Não'}</td>
                    <td>${Utils.dateFormat(result._register)}</td>
                    <td>
                        <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                        <button type="button" class="btn btn-danger btn-xs btn-flat">Excluir</button>
                    </td>
                </tr>
            `;

                this.addEventsTr(tr);

                this.updateCount();

                this.formIdUpdateEl.reset();

                btn.disabled = false;

                this.showPanelCreate();

            }, (e) => {
                console.error(e);
            });

        });

    }

    //método para enviar os dados que foram preenchidos no formulário
    onSubmit() {

        this.formEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values)
                return false;

            this.getPhoto(this.formEl).then(
                    (content) => {

                values.photo = content;

                this.insert(values);

                this.addLine(values);

                this.formEl.reset();

                btn.disabled = false;

            }, (e) => {
                console.error(e);
            });

        });

    }

    //método responsavel fazer upload de arquivos em PNG/JPG/JPEG/GIF
    getPhoto(formEl) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item => {

                if (item.name === 'photo') {
                    return item;
                }

            });

            let file = elements[0].files[0];

            fileReader.onload = () => {

                resolve(fileReader.result);

            };

            fileReader.onerror = (e) => {

                reject(e);

            };

            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg');
            }
        });

    }

    //método para pegar os valores do formulário selecionado
    getValues(formEl) {

        let user = {};
        let isValid = true;

        //transformando a função em um array [...this]
        [...formEl.elements].forEach(function (field, index) {

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error');

                isValid = false;

            }

            if (field.name == "gender") {

                if (field.checked) {
                    user[field.name] = field.value;
                }

            } else if (field.name === "admin") {

                user[field.name] = field.checked;

            } else {

                user[field.name] = field.value;

            }

        });

        if (!isValid) {
            return false;
        }

        return new User(
                user.name,
                user.gender,
                user.birth,
                user.country,
                user.email,
                user.password,
                user.photo,
                user.admin,
                );

    }

    //verificando se existe dados no sessionStorage
    getUsersStorage() {

        let users = [];

        if (sessionStorage.getItem("users")) {

            users = JSON.parse(sessionStorage.getItem("users"));

        }

        return users;


    }

    //método responsável por listar todos os dados que estão nosso sessionStorage
    selectAll() {

        let users = this.getUsersStorage();

        users.forEach(dataUser => {

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);

        });

    }

    //método responsável por inserir os dados no sessionStorage
    insert(data) {

        let users = this.getUsersStorage();

        users.push(data);

        sessionStorage.setItem("users", JSON.stringify(users));

    }

    //método que adiciona os dados na tabela
    addLine(dataUser) {

        let tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
            <tr>
                <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
                <td>${dataUser.name}</td>
                <td>${dataUser.email}</td>
                <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
                <td>${Utils.dateFormat(dataUser.register)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                </td>
            </tr>
        `;

        this.addEventsTr(tr);

        this.tableEl.appendChild(tr);

        this.updateCount();

    }

    //método responsavel por chamar os dados no formulário para edição
    addEventsTr(tr) {

        //Excluir os dados
        tr.querySelector(".btn-delete").addEventListener("click", e => {

            if (confirm("Deseje realmente excluir?")) {

                tr.remove();
                this.updateCount();

            }

        });

        //Editar dados
        tr.querySelector(".btn-edit").addEventListener("click", e => {

            let json = JSON.parse(tr.dataset.user);

            this.formIdUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {

                let field = this.formIdUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue;
                            break;
                        case 'radio':
                            field = this.formIdUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                            break;

                        case 'checkbox':
                            field.checked = json[name];
                            break;

                        default:
                            field.value = json[name];
                    }

                }

            }

            this.formIdUpdateEl.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();

        });

    }

    //chamando o formulário para criar o usuário
    showPanelCreate() {

        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";

    }

    //chamando o fomulário para editar o usuário
    showPanelUpdate() {

        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";

    }

    //método responsável por atualizar a quantidade de usuários cadastrados
    updateCount() {

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {

            numberUsers++;

            let user = JSON.parse(tr.dataset.user);

            if (user._admin)
                numberAdmin++;

        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;

    }

}