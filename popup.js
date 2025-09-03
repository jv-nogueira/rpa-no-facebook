let conteudoArquivo = "";

// Upload de arquivo
const input = document.getElementById("arquivo");
input.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { conteudoArquivo = e.target.result; console.log("Arquivo carregado:", conteudoArquivo); };
  reader.readAsText(file);
});

// Função para alternar Start/Stop e ocultar outros elementos
function toggleButton(btn) {
  const otherBtn = btn.id === "remover" ? document.getElementById("salvar") : document.getElementById("remover");
  const uploadInput = document.getElementById("arquivo");

  if (btn.textContent.includes("Stop")) {
    // Voltando ao estado inicial
    btn.textContent = btn.id === "remover" ? "Remover grupos" : "Salvar grupos";
    otherBtn.style.display = "block";
    uploadInput.style.display = "block";
  } else {
    // Iniciando execução
    btn.textContent = "Stop";
    otherBtn.style.display = "none";
    uploadInput.style.display = "none";
  }
}


// BOTÃO REMOVER
document.getElementById("remover").addEventListener("click", async function () {
  const btn = this;
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (btn.textContent.includes("Stop")) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.stopExecution = true; } });
    toggleButton(btn);
    return;
  }

  toggleButton(btn);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: startRemover, args: [conteudoArquivo || null] });
});

// BOTÃO SALVAR
document.getElementById("salvar").addEventListener("click", async function () {
  const btn = this;
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (btn.textContent.includes("Stop")) {
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { window.stopExecution = true; } });
    toggleButton(btn);
    return;
  }

  toggleButton(btn);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extrairDadosLista });
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
