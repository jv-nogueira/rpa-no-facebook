let conteudoArquivo = "";

// Recupera estado do popup (se algum script está rodando)
chrome.storage.local.get(["executando", "botaoAtivo"], (data) => {
  const btnId = data.botaoAtivo || null;
  if (data.executando && btnId) {
    const btn = document.getElementById(btnId);
    if (btn) toggleButton(btn, true);
  } else {
    resetLayout();
  }
});

// Listener para receber mensagens do script injetado na aba
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.tipo === "execucao_finalizada") {
    mostrarMensagemFinal();
  }
});

// Verifica a URL ao abrir a extensão
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  const urlCorreta = "https://www.facebook.com/groups/joins";

  if (!tab.url.includes(urlCorreta)) {
    // Esconde o layout principal
    document.getElementById("salvar").style.display = "none";
    document.getElementById("remover").style.display = "none";
    document.getElementById("arquivo").style.display = "none";
    document.getElementById("removerArquivo").style.display = "none";
    document.getElementById("mensagemUpload").style.display = "none";
    // >>> força esconder o aviso de execução, caso exista
    const avisoStop = document.getElementById("avisoStop");
    if (avisoStop) avisoStop.style.display = "none";

    // Cria container para mensagem e botão
    let avisoContainer = document.createElement("div");
    avisoContainer.id = "avisoUrl";
    avisoContainer.style.textAlign = "center";
    avisoContainer.style.padding = "20px";

    let avisoTexto = document.createElement("p");
    avisoTexto.textContent = "Clique abaixo para ser redirecionado para a página correta.";
    avisoTexto.style.marginBottom = "15px";
    avisoContainer.appendChild(avisoTexto);

    let btnIrParaUrl = document.createElement("button");
    btnIrParaUrl.textContent = "Ir para os grupos";
    btnIrParaUrl.className = "btn btn-primary btn-block";
    btnIrParaUrl.addEventListener("click", () => {
      chrome.tabs.update(tab.id, { url: urlCorreta }, () => {
        avisoContainer.remove();  // remove a mensagem de aviso
        resetLayout();           // volta para a tela inicial da extensão
      });
    });

    avisoContainer.appendChild(btnIrParaUrl);
    document.body.appendChild(avisoContainer);
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
  const btnVoltar = document.getElementById("voltar");
  const btnDownloads = document.getElementById("downloads");

  // cria span para o texto se ainda não existir
  let textSpan = btn.querySelector(".btn-text");
  if (!textSpan) {
    textSpan = document.createElement("span");
    textSpan.className = "btn-text";
    textSpan.textContent = btn.textContent;
    btn.textContent = "";
    btn.appendChild(textSpan);
  }

  // cria spinner se ainda não existir
  let spinner = btn.querySelector(".spinner-border");
  if (!spinner) {
    spinner = document.createElement("span");
    spinner.className = "spinner-border spinner-border-sm ms-2";
    spinner.role = "status";
    spinner.style.display = "none";
    btn.appendChild(spinner);
  }

  let aviso = document.getElementById("avisoStop");

  if (!inicial && textSpan.textContent === "Stop") {
    // voltar ao estado inicial
    textSpan.textContent = btn.id === "remover" ? "Remover grupos" : "Salvar grupos";
    otherBtn.style.display = "block";
    uploadInput.style.display = "block";
    mensagemUpload.style.display = "block";
    if (conteudoArquivo) uploadRemoveBtn.style.display = "block";
    if (btnVoltar) btnVoltar.style.display = "none";
    if (btnDownloads) btnDownloads.style.display = "none";
    spinner.style.display = "none";

    if (aviso) aviso.style.display = "none"; // esconde o aviso

    chrome.storage.local.set({executando: false, botaoAtivo: null});
  } else {
    // iniciar execução
    textSpan.textContent = "Stop";
    otherBtn.style.display = "none";
    uploadInput.style.display = "none";
    uploadRemoveBtn.style.display = "none";
    mensagemUpload.style.display = "none";
    if (btnVoltar) btnVoltar.style.display = "none";
    if (btnDownloads) btnDownloads.style.display = "none";
    spinner.style.display = "inline-block";

    if (!aviso) {
      aviso = document.createElement("div");
      aviso.id = "avisoStop";
      aviso.textContent = "Não minimize e não troque de aba pois pode comprometer o funcionamento.";
      aviso.style.color = "red";
      aviso.style.fontWeight = "bold";
      aviso.style.marginBottom = "10px";
      aviso.style.textAlign = "center";
      btn.parentNode.insertBefore(aviso, btn);
    }
    aviso.style.display = "block";

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

// Botão Voltar
const btnVoltar = document.createElement("button");
btnVoltar.id = "voltar";
btnVoltar.textContent = "Voltar";
btnVoltar.className = "btn btn-primary btn-block";
btnVoltar.style.display = "none";
btnVoltar.addEventListener("click", resetLayout);
document.body.appendChild(btnVoltar);

// Botão Downloads
const btnDownloads = document.createElement("button");
btnDownloads.id = "downloads";
btnDownloads.textContent = "Abrir downloads";
btnDownloads.className = "btn btn-secondary btn-block";
btnDownloads.style.display = "none";
btnDownloads.addEventListener("click", () => chrome.tabs.create({ url: "chrome://downloads" }));
document.body.appendChild(btnDownloads);

// ---------- FUNÇÕES AUXILIARES ----------
function resetLayout() {
  const salvarBtn = document.getElementById("salvar");
  const removerBtn = document.getElementById("remover");
  const uploadInput = document.getElementById("arquivo");
  const uploadRemoveBtn = document.getElementById("removerArquivo");
  const mensagemUpload = document.getElementById("mensagemUpload");
  const voltarBtn = document.getElementById("voltar");
  const downloadsBtn = document.getElementById("downloads");
  const aviso = document.getElementById("avisoStop"); // <<< pega o aviso

  salvarBtn.style.display = "block";
  removerBtn.style.display = "block";
  uploadInput.style.display = "block";
  mensagemUpload.style.display = "block";
  mensagemUpload.textContent = "Upload dos grupos que não serão removidos";
  if (conteudoArquivo) uploadRemoveBtn.style.display = "block";
  voltarBtn.style.display = "none";
  downloadsBtn.style.display = "none";

  salvarBtn.textContent = "Salvar grupos";
  removerBtn.textContent = "Remover grupos";

  if (aviso) aviso.style.display = "none"; // <<< esconde aqui também

  chrome.storage.local.set({executando: false, botaoAtivo: null});
}


function mostrarMensagemFinal() {
  const salvarBtn = document.getElementById("salvar");
  const removerBtn = document.getElementById("remover");
  const uploadInput = document.getElementById("arquivo");
  const uploadRemoveBtn = document.getElementById("removerArquivo");
  const mensagemUpload = document.getElementById("mensagemUpload");
  const voltarBtn = document.getElementById("voltar");
  const downloadsBtn = document.getElementById("downloads");
  const aviso = document.getElementById("avisoStop"); // <<< pega o aviso

  salvarBtn.style.display = "none";
  removerBtn.style.display = "none";
  uploadInput.style.display = "none";
  uploadRemoveBtn.style.display = "none";
  mensagemUpload.textContent = "Todos os grupos foram salvos e exportados para download.";
  mensagemUpload.style.display = "block";
  voltarBtn.style.display = "block";
  downloadsBtn.style.display = "block";

  if (aviso) aviso.style.display = "none"; // <<< esconde o aviso ao finalizar
}


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
      setTimeout(() => openOptions(i), 1000);
      console.log("Removendo grupo:", title, link);
    } else {
      console.log("Permitido:", title, link);
      i++;
      setTimeout(linksPermitidos, 1000);
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
    const opcao = Array.from(document.querySelectorAll("[role='menuitem']"))
                        .find(x => x.innerText.trim() === "Sair do grupo");
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

    // Limpa storage e reseta layout
    chrome.storage.local.set({executando: false, botaoAtivo: null}, () => {
      chrome.runtime.sendMessage({ tipo: "execucao_finalizada" });
      resetLayout(); // Garante que ao abrir de novo a extensão, estará na tela inicial
    });
  }

  processarItem();
}
