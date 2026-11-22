const chooser = document.querySelector("#chooser");
const viewer = document.querySelector("#viewer");
const frame = document.querySelector("#model-frame");
const viewerTitle = document.querySelector("#viewer-title");
const backButton = document.querySelector("#back-button");

const models = {
  mosque: {
    title: "Al-Aqmar Mosque",
    id: "f2f20ea58107449c8b6d7fab28366b98",
  },
  details: {
    title: "Mosque Details",
    id: "fc723b90416a4ffba7724d27a20364c4",
  },
};

document.querySelectorAll(".choice").forEach((button) => {
  button.addEventListener("click", () => {
    const model = models[button.dataset.model];
    viewerTitle.textContent = model.title;
    frame.title = model.title;
    frame.src =
      `https://sketchfab.com/models/${model.id}/embed` +
      "?autostart=1&transparent=1&ui_infos=0&ui_stop=0&ui_watermark=0";
    chooser.hidden = true;
    viewer.hidden = false;
  });
});

backButton.addEventListener("click", () => {
  frame.removeAttribute("src");
  viewer.hidden = true;
  chooser.hidden = false;
});
