/*
// Clica para abrir as opções
document.querySelectorAll("[role='listitem']")[i].querySelector("i").click()

// Clica na opção 'Sair'
document.querySelectorAll("[role='menuitem']")[5]

// Clicar para nao adicionar novamente
if(document.querySelector("[role='dialog']").querySelector("input").ariaChecked=="false"){
  document.querySelector("[role='dialog']").querySelector("input").click()
}

// Clica no botão 'Sair do grupo'
document.querySelector("[role='dialog']").querySelectorAll("[role='button']")[2]

// Clica no botão 'Sair' no popup de denunciar o grupo
document.querySelectorAll("[role='dialog']")[1].querySelector("[role='button']").click()
*/




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
  fetch(chrome.runtime.getURL('lista-grupos.txt'))
    .then(response => response.text())
    .then(text => {
      const permitidosUsername = new Set(text.split(/\r?\n/).map(line => line.trim()));
      console.log(permitidosUsername);

      function openOptions(i) {
        const item = document.querySelectorAll("[role='listitem']")[i];
        if (item && item.querySelector("i")) {
          item.querySelector("i").click();
          console.log("Cliquei em abrir opções");
          optionExit();
        } else {
          setTimeout(() => openOptions(i), 300);
          console.log("Aguardando openOptions");
        }
      }

      function optionExit() {
        const opcao = document.querySelectorAll("[role='menuitem']")[5];
        if (opcao) {
          opcao.click();
          console.log("Cliquei em 'Sair'");
          uncheckAddAgain();
        } else {
          setTimeout(optionExit, 300);
          console.log("Aguardando optionExit");
        }
      }

      function uncheckAddAgain() {
        const dialog = document.querySelector("[role='dialog']");
        if (dialog) {
          const input = dialog.querySelector("input");
          if (input && input.getAttribute("aria-checked") === "false") {
            input.click();
            console.log("Desmarquei 'Adicionar novamente'");
          }
          clickLeaveGroup();
        } else {
          setTimeout(uncheckAddAgain, 300);
          console.log("Aguardando uncheckAddAgain");
        }
      }

      function clickLeaveGroup() {
        const dialog = document.querySelector("[role='dialog']");
        if (dialog) {
          const btn = dialog.querySelectorAll("[role='button']")[2];
          if (btn) {
            btn.click();
            console.log("Cliquei em 'Sair do grupo'");
            clickReportLeave();
          } else {
            setTimeout(clickLeaveGroup, 300);
            console.log("Aguardando clickLeaveGroup");
          }
        } else {
          setTimeout(clickLeaveGroup, 300);
          console.log("Aguardando dialog em clickLeaveGroup");
        }
      }

      function clickReportLeave() {
        const dialogs = document.querySelectorAll("[role='dialog']");
        if (dialogs.length > 1) {
          const btn = dialogs[1].querySelector("[role='button']");
          if (btn) {
            btn.click();
            console.log("Cliquei em 'Sair' na denúncia");
          } else {
            setTimeout(clickReportLeave, 300);
            console.log("Aguardando botão em clickReportLeave");
          }
        } else {
          setTimeout(clickReportLeave, 300);
          console.log("Aguardando dialogs em clickReportLeave");
        }
      }
    });
}
