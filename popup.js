// Botão Extrair Amigos
document.getElementById("extrair").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  window.close();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const dadosExtraidos = [];
      let i = 0;

      function nextProfile() {
        const profileReference = document.querySelectorAll("[data-pagelet='ProfileAppSection_0']")[0]
          .children[0].children[0].children[0].children[0].children[2].children;

        const totalPerfis = profileReference.length;

        if (totalPerfis === 0) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
          setTimeout(nextProfile, 4000);
          return;
        }

        console.log(profileReference.length + " indice " + i)

        if (i < totalPerfis) {
          profileReference[i].scrollIntoView({ behavior: "smooth" });

          try {
            const referenceProfileURL = profileReference[i].querySelectorAll("a")[1];
            if (referenceProfileURL && referenceProfileURL.href) {
              const getName = referenceProfileURL.children[0].innerText;
              const profileURL = referenceProfileURL.href;
              const getImage = profileReference[i].querySelector("img").src;
              dadosExtraidos.push({ imagem: `=image("${getImage}")`, nome: getName, url: profileURL });
            } else {
              const getNameClosed = profileReference[i].children[1].children[0].children[0].innerText;
              const getImageClosed = profileReference[i].querySelector("img").src;
              dadosExtraidos.push({ imagem: `=image("${getImageClosed}")`, nome: getNameClosed, url: "Perfil desativado" });
            }
          } catch (err) {
            console.error(`Erro ao processar item ${i}:`, err);
          }

          i++;
          setTimeout(nextProfile, i <= totalPerfis - 5 ? 50 : 1000);
        } else {
          // salvar arquivo
          const txtContent = "\uFEFFImagem\tNome\tURL\n" +
            dadosExtraidos.map(item => `${item.imagem}\t${item.nome}\t${item.url}`).join("\n");
          const blob = new Blob([txtContent], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "lista-de-perfis-salvos.txt";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        }
      }

      nextProfile();
    }
  });
});

// Botão Remover Amigos
document.getElementById("remover").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const fileInput = document.getElementById("arquivoPermitidos");
  let permitidosURL = [];

  // Se não houver arquivo, perguntar ao usuário
  if (!fileInput.files[0]) {
    const confirmarTodos = confirm("Nenhum arquivo selecionado. Deseja remover todos os amigos sem exceção?");
    if (!confirmarTodos) return; // Se cancelar, não faz nada
  } else {
    const fileText = await fileInput.files[0].text();
    permitidosURL = fileText.split("\n").map(l => l.trim());
  }
  window.close();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (permitidosURL) => {

      const dadosExtraidos = [];
      let i = 0;

      function percorrer() {
        const profileReference = document.querySelectorAll('[data-pagelet="ProfileAppSection_0"]')[0]
          .children[0].children[0].children[0].children[0].children[2].children;

        if(i >= profileReference.length){
          // salvar arquivo
          const txtContent = "\uFEFFImagem\tNome\tURL\n" +
            dadosExtraidos.map(item => `${item.imagem}\t${item.nome}\t${item.url}`).join("\n");
          const blob = new Blob([txtContent], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "lista-de-unfriend.txt";
          link.click();
          URL.revokeObjectURL(link.href);
          return;
        }

        const profile = profileReference[i];
        profile.scrollIntoView({ behavior: "smooth" });

        const referenceProfileURL = profile.querySelectorAll("a")[1];
        let getName = "", profileURL = "", getImage = "";

        if (referenceProfileURL && referenceProfileURL.href) {
          getName = referenceProfileURL.children[0].innerText;
          profileURL = referenceProfileURL.href;
          getImage = profile.querySelector("img")?.src || "";
        } else {
          getName = profile.children[1]?.children[0]?.children[0]?.innerText || "Perfil desativado";
          profileURL = "Perfil desativado";
          getImage = profile.querySelector("img")?.src || "";
        }

        dadosExtraidos.push({ imagem: `=image("${getImage}")`, nome: getName, url: profileURL });

        // Se não houver arquivo, remove todos
        if (!permitidosURL.length || !permitidosURL.includes(profileURL)) {
          const buttonUnfriend = profile.children[2]?.children[0]?.children[0]?.children[0];
          buttonUnfriend?.click();

          setTimeout(() => {
            const removeFriend = [...document.querySelectorAll("[role='menuitem']")]
              .find(el => el.textContent === 'Remover amizade');
            removeFriend?.click();

            setTimeout(() => {
              const buttonConfirm = document.querySelectorAll("[aria-label='Cancelar']")[0];
              buttonConfirm?.click();
              i++;
              setTimeout(percorrer, 2000);
            }, 2000);
          }, 2000);
        } else {
          i++;
          setTimeout(percorrer, 500);
        }
      }

      percorrer();
    },
    args: [permitidosURL]
  });
});
