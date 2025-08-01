document.getElementById("executar").addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  window.close();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extrairDados
  });
});

function extrairDados() {
  const dadosExtraidos = [];
  let i = 0;

  nextProfile(); // inicia o loop

  function nextProfile() {
    // Seleciona todos os perfis
    const profileReference = document.querySelectorAll("[data-pagelet='ProfileAppSection_0']")[0]
      .children[0].children[0].children[0].children[0].children[2].children;

    const totalPerfis = profileReference.length;

    if (totalPerfis === 0) {
      // Caso a lista ainda não tenha carregado nada
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      console.log("Lista vazia. Tentando carregar...");
      setTimeout(nextProfile, 4000);
      return;
    }

    if (i < totalPerfis) {
      console.log("Processando índice:", i);

      // Faz o scroll até o item atual (simula ação humana)
      profileReference[i].scrollIntoView({ behavior: "smooth" });

      try {
        // Tenta pegar o link do perfil
        const referenceProfileURL = profileReference[i].querySelectorAll("a")[1];

        if (referenceProfileURL && referenceProfileURL.href) {
          // Perfil ativo
          const getName = referenceProfileURL.children[0].innerText;
          const profileURL = referenceProfileURL.href;
          const getImage = profileReference[i].querySelector("img").src
          dadosExtraidos.push({ imagem: '=image("'+getImage+'")', nome: getName, url: profileURL });
        } else {
          // Perfil desativado (sem href)
          const getNameClosed = profileReference[i].children[1].children[0].children[0].innerText;
          const getImageClosed = profileReference[i].querySelector("img").src
          dadosExtraidos.push({ imagem: '=image("'+getImageClosed+'")', nome: getNameClosed, url: "Perfil desativado" });
        }
      } catch (err) {
        console.error(`Erro ao processar item ${i}:`, err);
      }

      i++;

      // Se ainda não chegou no final, usa timer menor
      if (i <= totalPerfis - 5) {
        setTimeout(nextProfile, 50); // intervalo curto
      } else {
        // Quando chega perto do fim, dá um tempo maior para a página carregar mais perfis
        console.log("Aguardando carregamento de mais perfis...");
        setTimeout(nextProfile, 1000);
      }

    } else {
      console.log("Fim da lista atual.");
      salvarComoTxt(dadosExtraidos);
    }
  }

  function salvarComoTxt(dados) {
    // Cria conteúdo do arquivo
    const txtContent = "\uFEFFImagem\tNome\tURL\n" + dados.map(item => `${item.imagem}\t${item.nome}\t${item.url}`).join("\n");

    // Cria o Blob e o link de download
    const blob = new Blob([txtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "listaPerfis.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
