const userId = 8; 
let usuarioAtual = null; 

document.getElementById("btn-criar-log").addEventListener("click", () => {
    const form = document.getElementById("form-criar-log");
    form.style.display = form.style.display === "none" ? "block" : "none";
}); 

function criarCardLog(log) {
    const container = document.getElementById("container-logs");
    const card = document.createElement("div");
    card.classList.add("card-comments");

    card.innerHTML = `
        <div class="infos-user">
            <div style="display:flex; align-items:center;">
                <img src="../img/image.png" width="40" height="40" style="border-radius:50%;" alt="usuario">
                <div class="texto-user">
                    <p>${log.nome || "Usuário #" + log.id_user}</p>
                    <p>${new Date().toLocaleString()}</p>
                </div>
            </div>
            <p id="filtro">${log.categoria || "Sem categoria"}</p>
        </div>

        <div class="card-dentro-central">
            <h4>${log.titulo || 'Título não disponível'}</h4>
            <p>${log.descricao || 'Sem descrição'}</p>
            <div class="hlb">
                <p>${log.horas_trabalhadas || 0} horas trabalhadas</p>
                <p>${log.linhas_codigo || 0} linhas de código</p>
                <p>${log.bugs_corrigidos || 0} bugs corrigidos</p>
            </div>
            <div class="likes-comentarios">
                <button class="btn-like" data-logid="${log.id}" data-userid="${userId}">
                    ${log.likes || 0} 👍
                </button>
                <span style="margin-left: 5px;">${log.qnt_comments || 0} 💬</span>
            </div>
        </div>
    `;
    container.prepend(card);

    const botao = card.querySelector(".btn-like");
    botao.addEventListener("click", () => atualizarLikeBotao(botao));
}

document.getElementById("submit-log").addEventListener("click", async () => {
    if (!usuarioAtual) {
        alert("Usuário ainda não carregado!");
        return;
    }

    const categoria = document.getElementById("categoria").value;
    const titulo = document.getElementById("titulo").value.trim();
    const horas_trabalhadas = Number(document.getElementById("horas_trabalhadas").value);
    const linhas_codigo = Number(document.getElementById("linhas_codigo").value);
    const bugs_corrigidos = Number(document.getElementById("bugs_corrigidos").value);
    const descricao = document.getElementById("descricao").value.trim();

    if (!categoria || !titulo || isNaN(horas_trabalhadas) || isNaN(linhas_codigo) || isNaN(bugs_corrigidos) || !descricao) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id_user: usuarioAtual.id,
                nome: usuarioAtual.nome, 
                categoria,
                titulo,
                horas_trabalhadas,
                linhas_codigo,
                bugs_corrigidos,
                descricao
            })
        });

        const novoLog = await response.json();
        criarCardLog(novoLog[0]);

     
        document.getElementById("form-criar-log").style.display = "none";
        document.getElementById("horas_trabalhadas").value = "";
        document.getElementById("linhas_codigo").value = "";
        document.getElementById("bugs_corrigidos").value = "";
        document.getElementById("descricao").value = "";
        document.getElementById("titulo").value = "";

    } catch (error) {
        console.error("Erro ao criar log:", error);
        alert("Erro ao criar log!");
    }
});

async function atualizarLikeBotao(botao) {
    const log_id = Number(botao.dataset.logid);
    const user_id = Number(botao.dataset.userid);
    const liked = botao.classList.contains("liked");
    let likesAtuais = Number(botao.innerText.split(' ')[0]) || 0;

    try {
        if (!liked) {
            const resp = await fetch("http://localhost:3000/likes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ log_id, user_id })
            });

            if (!resp.ok) throw new Error("Erro ao dar like: " + resp.status);
            botao.classList.add("liked");
            botao.innerText = `${likesAtuais + 1} 👍`;
        } else {
            const resp = await fetch(`http://localhost:3000/likes?log_id=${log_id}&user_id=${user_id}`, {
                method: "DELETE"
            });

            if (!resp.ok) throw new Error("Erro ao remover like: " + resp.status);
            botao.classList.remove("liked");
            botao.innerText = `${Math.max(0, likesAtuais - 1)} 👍`;
        }
    } catch (error) {
        console.error("Erro ao atualizar like:", error);
        alert("Erro na operação de like. Verifique a console e o servidor.");
    }
}

async function carregarLogInicial() {
    try {
        const response = await fetch("http://localhost:3000/logs/5");
        if (!response.ok) throw new Error("Erro ao buscar log ID=5");

        const log = await response.json();
        criarCardLog(log);
        console.log("Log carregado:", log);
    } catch (error) {
        console.error("Erro ao carregar log inicial:", error);
    }
}

const checkboxesFiltro = document.querySelectorAll('input[type="checkbox"]');
checkboxesFiltro.forEach(checkbox => {
    checkbox.addEventListener('change', aplicarFiltros);
});

async function aplicarFiltros() {
    const categoriasSelecionadas = Array.from(checkboxesFiltro)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    const response = await fetch("http://localhost:3000/logs");
    const data = await response.json();

    const logsFiltrados = data.logs.filter(log =>
        categoriasSelecionadas.includes(log.categoria)
    );

    exibirLogs(logsFiltrados);
}

function exibirLogs(logs) {
    const container = document.querySelector("#container-logs");
    container.innerHTML = "";
    logs.forEach(log => criarCardLog(log));
}

async function carregarUsuario(id) {
    try {
        const resposta = await fetch(`http://localhost:3000/usuarios/${id}`);
        if (!resposta.ok) throw new Error("Usuário não encontrado");

        usuarioAtual = await resposta.json();
        console.log("Usuário carregado:", usuarioAtual);

        const nomeElemento = document.querySelector("#nomeUsuario");
        if (nomeElemento) {
            nomeElemento.textContent = usuarioAtual.nome;
        }
    } catch (erro) {
        console.error("Erro ao carregar usuário:", erro);
    }
}


async function carregarUsuarios() {
    try {
        const resposta = await fetch("http://localhost:3000/usuarios")
        const data = await resposta.json()

        const usuarios = data.usuarios
        const atividadeContainer = document.getElementById("atividade-recente")
        const destaqueContainer = document.getElementById("dev-destaque")

        atividadeContainer.innerHTML = ""
        destaqueContainer.innerHTML = ""

        usuarios.slice(0, 2).forEach(u => {
            atividadeContainer.innerHTML += `
                <div class="card-direito-usuario">
                    <img src="../img/image.png" alt="usuario">
                    <p>${u.nome}</p>
                </div>
            `
        })

        usuarios.slice(2, 4).forEach(u => {
            destaqueContainer.innerHTML += `
                <div class="card-direito-usuario">
                    <img src="../img/image.png" alt="usuario">
                    <p>${u.nome}</p>
                </div>
            `
        })

    } catch (erro) {
        console.error("Erro ao carregar usuários:", erro)
    }
}

carregarUsuarios()


  window.addEventListener("DOMContentLoaded", () => {
    carregarLogInicial();
    carregarUsuario(userId);
});