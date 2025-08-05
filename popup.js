// Clicar para abrir as opções
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