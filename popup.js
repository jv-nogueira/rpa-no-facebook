let conteudoArquivo = "";

// Recupera estado do popup (se algum script está rodando)
chrome.storage.local.get(["executando", "botaoAtivo"], (data) => {
  const btnId = data.botaoAtivo || null;
  if (data.executando && btnId) {
    const btn = document.getElementById(btnId);
    if (btn) toggleButton(btn, true);
  }
});

// Upload de arquivo
const input = document.getElementById("arquivo");
const btnRemoverArquivo = document.getElementById("removerArquivo");
input.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    conteudoArquivo = e.target.result;
    console.log("Arquivo carregado:", conteudoArquivo);
    btnRemoverArquivo.style.display = "block";
  };
  reader.readAsText(file);
});

// Remover arquivo carregado
btnRemoverArquivo.addEventListener("click", () => {
  conteudoArquivo = "";
  input.value = "";
  btnRemoverArquivo.style.display = "none";
  console.log("Arquivo removido");
});

// Alterna Start/Stop e oculta elementos
function toggleButton(btn, inicial=false) {
  const otherBtn = btn.id === "remover" ? document.getElementById("salvar") : document.getElementById("remover");
  const uploadInput = document.getElementById("arquivo");
  const uploadRemoveBtn = document.getElementById("removerArquivo");
  const mensagemUpload = document.getElementById("mensagemUpload");

  if (!inicial && btn.textContent.includes("Stop")) {
    // Voltando ao estado inicial
    btn.textContent = btn.id === "remover" ? "Remover grupos" : "Salvar grupos";
    otherBtn.style.display = "block";
    uploadInput.style.display = "block";
    mensagemUpload.style.display = "block";
    if (conteudoArquivo) uploadRemoveBtn.style.display = "block";

    chrome.storage.local.set({executando: false, botaoAtivo: null});
  } else {
    // Iniciando execução
    btn.textContent = "Stop";
    otherBtn.style.display = "none";
    uploadInput.style.display = "none";
    uploadRemoveBtn.style.display = "none";
    mensagemUpload.style.display = "none";

    chrome.storage.local.set({executando: true, botaoAtivo: btn.id});
  }
}

// Função genérica para lidar com clique de botões
async function handleClick(btn, func, args=[]) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (btn.textContent.includes("Stop")) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.stopExecution = true; } });
    toggleButton(btn);
    return;
  }

  if (btn.id === "remover" && !conteudoArquivo) {
    const confirmado = confirm("Nenhum arquivo foi carregado. Deseja remover todos os grupos?");
    if (!confirmado) return;
  }

  toggleButton(btn);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func, args });
}

// ---------- EVENTOS BOTÕES ----------
document.getElementById("remover").addEventListener("click", function() {
  handleClick(this, startRemover, [conteudoArquivo || null]);
});

document.getElementById("salvar").addEventListener("click", function() {
  handleClick(this, extrairDadosLista);
});

// ---------- SCRIPT DE REMOVER ----------
function startRemover(listaTexto) {
  window.stopExecution = false;
  let i = 0;
  let permitidos = listaTexto ? new Set(listaTexto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) : new Set();

  function linksPermitidos() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const grupos = document.querySelectorAll("[role='listitem']");
    if (i >= grupos.length) return console.log("Todos os grupos processados");

    const grupo = grupos[i];
    const link = grupo.querySelector("a")?.href;
    const title = grupo.querySelectorAll("a")[1]?.textContent?.trim() || "";
    grupo.scrollIntoView();

    if (permitidos.size === 0 || !permitidos.has(link)) {
      setTimeout(() => openOptions(i), 2500);
      console.log("Removendo grupo:", title, link);
    } else {
      console.log("Permitido:", title, link);
      i++;
      setTimeout(linksPermitidos, 2500);
    }
  }

  function openOptions(idx) {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const item = document.querySelectorAll("[role='listitem']")[idx];
    if (item && item.querySelector("i")) {
      item.querySelector("i").click();
      setTimeout(optionExit, 2000);
    } else setTimeout(() => openOptions(idx), 1000);
  }

  function optionExit() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const opcao = Array.from(document.querySelectorAll("[role='menuitem']")).find(x => x.innerText.trim() === "Sair do grupo");
    if (opcao) { opcao.click(); setTimeout(uncheckAddAgain, 2000); } 
    else setTimeout(optionExit, 1000);
  }

  function uncheckAddAgain() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const dialog = document.querySelector("[role='dialog']");
    if (dialog) {
      const input = dialog.querySelector("input");
      if (input && input.getAttribute("aria-checked") === "false") input.click();
      setTimeout(clickLeaveGroup, 1000);
    } else setTimeout(uncheckAddAgain, 1000);
  }

  function clickLeaveGroup() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const dialog = document.querySelector("[role='dialog']");
    if (dialog) {
      const btn = dialog.querySelectorAll("[role='button']")[2];
      if (btn) { btn.click(); setTimeout(clickReportLeave, 1500); }
      else setTimeout(clickLeaveGroup, 1000);
    } else setTimeout(clickLeaveGroup, 1000);
  }

  function clickReportLeave() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const dialogs = document.querySelectorAll("[role='dialog']");
    if (dialogs.length > 1) {
      const btn = dialogs[1].querySelector("[role='button']");
      if (btn) { btn.click(); i++; setTimeout(linksPermitidos, 1500); }
      else setTimeout(clickReportLeave, 1000);
    } else { i++; setTimeout(linksPermitidos, 1000); }
  }

  linksPermitidos();
}

// ---------- SCRIPT DE SALVAR ----------
function extrairDadosLista() {
  window.stopExecution = false;
  let i = 0;
  let resultado = "";

  function processarItem() {
    if (window.stopExecution) return console.log("Execução interrompida pelo usuário");
    const lista = document.querySelectorAll("[role='listitem']");
    if (i >= lista.length) return downloadTxtFile(resultado);

    const link = lista[i].querySelector("a")?.href || "";
    const titulo = lista[i].querySelectorAll("a")[1]?.textContent?.trim() || "";
    resultado += `${i}\t${titulo}\t${link}\n`;
    lista[i].scrollIntoView();

    i++;
    setTimeout(processarItem, 500);
  }

  function downloadTxtFile(content) {
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lista_resultado.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("Download concluído");
  }

  processarItem();
}
