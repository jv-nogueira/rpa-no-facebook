let conteudoArquivo = "";

// Captura o arquivo quando o usuário seleciona
const input = document.getElementById("arquivo");
input.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    conteudoArquivo = e.target.result;
    console.log("Arquivo carregado no popup:", conteudoArquivo);
    // alert removido
  };
  reader.readAsText(file);
});

// ---------- BOTÃO REMOVER ----------
document.getElementById("remover").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (conteudoArquivo) {
    // Se houve upload, executa direto
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: startRemover,
      args: [conteudoArquivo]
    });
  } else {
    // Se não houve upload, pede confirmação
    const confirmado = confirm("Tem certeza que deseja remover todos os grupos?");
    if (confirmado) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: startRemover
      });
    } else {
      console.log("Remoção cancelada pelo usuário");
    }
  }
});

// ---------- BOTÃO SALVAR ----------
document.getElementById("salvar").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairDadosLista
  });
});

// ---------- SCRIPT DE REMOVER ----------
function startRemover(listaTexto) {
  var i = 0;
  let permitidosUsername = new Set();

  if (listaTexto) {
    permitidosUsername = new Set(
      listaTexto.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    );
    console.log("Usando conteúdo do arquivo upload:", listaTexto);
  } else {
    console.log("Nenhum arquivo carregado, removendo todos os grupos");
  }

  linksPermitidos();

  function linksPermitidos() {
    const grupo = document.querySelectorAll("[role='listitem']")[i];
    if (!grupo) return console.log("Nenhum grupo encontrado ou lista finalizada");

    const link = grupo.querySelector("a")?.getAttribute("href");
    const title = grupo.querySelectorAll("a")[1]?.textContent?.trim() || "";
    grupo.scrollIntoView();

    if (permitidosUsername.size === 0 || !permitidosUsername.has(link)) {
      setTimeout(() => openOptions(i), 2500);
      console.log("Esse grupo", title,"será removido:", link);
    } else {
      console.log("Esse grupo", title,"está na lista de permitidos:", link);
      i++;
      setTimeout(linksPermitidos, 2500);
    }
  }

  function openOptions(i) {
    const item = document.querySelectorAll("[role='listitem']")[i];
    if (item && item.querySelector("i")) {
      setTimeout(() => item.querySelector("i").click(), 2000);
      console.log("Cliquei em abrir opções");
      setTimeout(optionExit, 5000);
    } else {
      setTimeout(() => openOptions(i), 2500);
      console.log("Aguardando openOptions");
    }
  }

  function optionExit() {
    const opcao = Array.from(document.querySelectorAll("[role='menuitem']"))
      .find(item => item.innerText.trim() === "Sair do grupo");
    if (opcao) {
      setTimeout(() => opcao.click(), 2000);
      console.log("Cliquei em 'Sair'");
      setTimeout(uncheckAddAgain, 2500);
    } else {
      setTimeout(optionExit, 2500);
      console.log("Aguardando optionExit");
    }
  }

  function uncheckAddAgain() {
    const dialog = document.querySelector("[role='dialog']");
    if (dialog) {
      const input = dialog.querySelector("input");
      if (input && input.getAttribute("aria-checked") === "false") {
        setTimeout(() => input.click(), 2000);
        console.log("Desmarquei 'Adicionar novamente'");
      }
      setTimeout(clickLeaveGroup, 2500);
    } else {
      setTimeout(uncheckAddAgain, 2500);
      console.log("Aguardando uncheckAddAgain");
    }
  }

  function clickLeaveGroup() {
    const dialog = document.querySelector("[role='dialog']");
    if (dialog) {
      const btn = dialog.querySelectorAll("[role='button']")[2];
      if (btn) {
        setTimeout(() => btn.click(), 2000);
        console.log("Cliquei em 'Sair do grupo'");
        setTimeout(clickReportLeave, 2500);
      } else {
        setTimeout(clickLeaveGroup, 2500);
        console.log("Aguardando clickLeaveGroup");
      }
    } else {
      setTimeout(clickLeaveGroup, 2500);
      console.log("Aguardando dialog em clickLeaveGroup");
    }
  }

  function clickReportLeave() {
    const dialogs = document.querySelectorAll("[role='dialog']");
    if (dialogs.length > 1) {
      const btn = dialogs[1].querySelector("[role='button']");
      if (btn) {
        setTimeout(() => btn.click(), 2000);
        i++;
        setTimeout(linksPermitidos, 5000);
        console.log("Cliquei em 'Sair' na denúncia");
      } else {
        setTimeout(clickReportLeave, 2500);
        console.log("Aguardando botão em clickReportLeave");
      }
    } else {
      i++;
      setTimeout(linksPermitidos, 2500);
      console.log("Aguardando dialogs em clickReportLeave");
    }
  }
}

// ---------- SCRIPT DE SALVAR ----------
function extrairDadosLista() {
  let i = 0;
  let resultado = "";

  processarItem();

  function processarItem() {
    const lista = document.querySelectorAll("[role='listitem']");
    console.log("Total:", lista.length, "Index:", i);

    if (lista[i] !== undefined) {
      const link = lista[i].querySelector("a")?.getAttribute("href") || "";
      const titulo = lista[i].querySelectorAll("a")[1]?.textContent?.trim() || "";

      resultado += `${i}\t${titulo}\t${link}\n`;
      lista[i].scrollIntoView();

      if (i < lista.length - 3) {
        i++;
        setTimeout(processarItem, 500);
      } else {
        i++;
        setTimeout(processarItem, 1000);
      }
    } else {
      console.log("Download iniciado");
      downloadTxtFile(resultado);
    }
  }

  function downloadTxtFile(content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "lista_resultado.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
