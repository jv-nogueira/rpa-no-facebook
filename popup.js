// Botão REMOVER
document.getElementById("remover").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  window.close();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startRemover
  });
});

// Botão SALVAR
document.getElementById("salvar").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  window.close();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairDadosLista
  });
});


// ---------- SCRIPT DE REMOVER ----------
function startRemover() {
  var i = 0;
  fetch(chrome.runtime.getURL('lista-grupos.txt'))
    .then(response => response.text())
    .then(text => {
      linksPermitidos();

      function linksPermitidos() {
        const grupo = document.querySelectorAll("[role='listitem']")[i];
        const link = grupo.querySelector("a")?.getAttribute("href");
        const permitidosUsername = new Set(text.split(/\r?\n/).map(line => line.trim()));
        grupo.scrollIntoView();

        if (!permitidosUsername.has(link)) {
          setTimeout(() => openOptions(i), 2500);
          console.log("Esse grupo não está na lista, será removido");
        } else {
          console.log("Esse grupo está na lista de permitidos");
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
    });
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
