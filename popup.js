document.getElementById("executar").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Fecha o popup
  window.close();

  // Executa o script no conteúdo da aba
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: start
  });
});

function start() {
  var i = 0
  fetch(chrome.runtime.getURL('lista-grupos.txt'))
    .then(response => response.text())
    .then(text => {
    linksPermitidos()
    function linksPermitidos(){
      const grupo = document.querySelectorAll("[role='listitem']")[i]
      const link = grupo.querySelector("a")?.getAttribute("href")
      const permitidosUsername = new Set(text.split(/\r?\n/).map(line => line.trim()));
      grupo.scrollIntoView()
      if(!permitidosUsername.has(link)){
        setTimeout(() => openOptions(i),5000)
        console.log("Esse grupo esta nao esta lista")
      }else{
        console.log("Esse grupo esta na lista para nao ser removido");
        i++;
        setTimeout(linksPermitidos,5000);
      }
    }

        function openOptions(i) {
          const item = document.querySelectorAll("[role='listitem']")[i];
          if (item && item.querySelector("i")) {
            setTimeout(() => item.querySelector("i").click(),2000)
            console.log("Cliquei em abrir opções");
            setTimeout(optionExit,5000);
          } else {
            setTimeout(() => openOptions(i), 5000);
            console.log("Aguardando openOptions");
          }
        }

        function optionExit() {
          const opcao = Array.from(document.querySelectorAll("[role='menuitem']"))
          .find(item => item.innerText.trim() === "Sair do grupo");
          if (opcao) {
            setTimeout(() => opcao.click(),2000)
            console.log("Cliquei em 'Sair'");
            setTimeout(uncheckAddAgain,5000);
          } else {
            setTimeout(optionExit, 5000);
            console.log("Aguardando optionExit");
          }
        }

        function uncheckAddAgain() {
          const dialog = document.querySelector("[role='dialog']");
          if (dialog) {
            const input = dialog.querySelector("input");
            if (input && input.getAttribute("aria-checked") === "false") {
              setTimeout(() => input.click(),2000);
              console.log("Desmarquei 'Adicionar novamente'");
            }
            setTimeout(clickLeaveGroup,5000);
          } else {
            setTimeout(uncheckAddAgain, 5000);
            console.log("Aguardando uncheckAddAgain");
          }
        }

        function clickLeaveGroup() {
          const dialog = document.querySelector("[role='dialog']");
          if (dialog) {
            const btn = dialog.querySelectorAll("[role='button']")[2];
            if (btn) {
              setTimeout(() => btn.click(),2000)
              console.log("Cliquei em 'Sair do grupo'");
              setTimeout(clickReportLeave,5000);
            } else {
              setTimeout(clickLeaveGroup, 5000);
              console.log("Aguardando clickLeaveGroup");
            }
          } else {
            setTimeout(clickLeaveGroup, 5000);
            console.log("Aguardando dialog em clickLeaveGroup");
          }
        }

        function clickReportLeave() {
          const dialogs = document.querySelectorAll("[role='dialog']");
          if (dialogs.length > 1) {
            const btn = dialogs[1].querySelector("[role='button']");
            if (btn) {
              setTimeout(() => btn.click(),2000)
              i++
              setTimeout(linksPermitidos,5000)
              console.log("Cliquei em 'Sair' na denúncia");
            } else {
              setTimeout(clickReportLeave, 5000);
              console.log("Aguardando botão em clickReportLeave");
            }
          } else {
            // setTimeout(clickReportLeave, 5000);
            i++
            setTimeout(linksPermitidos,5000)
            console.log("Aguardando dialogs em clickReportLeave");
          }
        }
    });
}
