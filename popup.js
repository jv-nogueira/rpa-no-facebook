// Botão Extrair Amigos
document.getElementById("extrair").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const fileInput = document.getElementById("permitidosExtrair");
  let permitidosURL = [];

  // Se não houver arquivo, perguntar ao usuário
  if (!fileInput.files[0]) {
    const confirmarTodos = confirm("Nenhum arquivo selecionado. Deseja extrair todos os amigos sem exceção?");
    if (!confirmarTodos) return;
  } else {
    const fileText = await fileInput.files[0].text();
    permitidosURL = fileText
      .split("\n")
      .map(l => l.trim());
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

        if (i >= profileReference.length) {
          const txtContent = "\uFEFFImagem\tNome\tURL\n" +
            dadosExtraidos.map(item =>
              `${item.imagem}\t${item.nome}\t${item.url}`
            ).join("\n");

          const blob = new Blob([txtContent], { type: "text/plain" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "lista-de-perfis-salvos.txt";
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

        if (!permitidosURL.length || !permitidosURL.includes(profileURL)) {
          dadosExtraidos.push({
            imagem: `=image("${getImage}")`,
            nome: getName,
            url: profileURL
          });

        } 
        if (i < profileReference.length - 4) { 
          i++; 
          setTimeout(percorrer, 100); 
        } else if(i < profileReference.length - 1) { 
          i++; 
          if (profileReference[i]) {
            profileReference[i].scrollIntoView(); 
          };
            setTimeout(percorrer, 2000); 
        }else{
          i++; 
          if (profileReference[i]) {
            profileReference[i].scrollIntoView(); 
          };
            setTimeout(percorrer, 8000); 
        };
      }

      percorrer();
    },
    args: [permitidosURL]
  });
});



// Botão Remover Amigos
document.getElementById("remover").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const fileInput = document.getElementById("permitidosRemover");
  let permitidosURL = [];

  // Se não houver arquivo, perguntar ao usuário
  if (!fileInput.files[0]) {
    const confirmarTodos = confirm("Nenhum arquivo selecionado. Deseja remover todos os amigos sem exceção?");
    if (!confirmarTodos) return; // Se cancelar, não faz nada
  } else {
    const fileText = await fileInput.files[0].text();
    permitidosURL = fileText
    .split("\n")
    .map(l => l.trim());
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
