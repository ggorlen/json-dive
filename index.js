let bracketsOnly = false;
let lastHighlighted = {style: {}};

const keyToStr = k =>
  !bracketsOnly && /^[a-zA-Z_$][a-zA-Z$_\d]*$/.test(k) 
    ? `.${toHTML(k)}`
    : `[&quot;${toHTML(k)}&quot;]`
;
const pathToData = p => `data-path="data${p.join("")}"`;

const htmlSpecialChars = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
  "\t": "\\t",
  "\r": "\\r",
  "\n": "\\n",
  " ": "&nbsp;",
};
const toHTML = x => ("" + x)
  .replace(/[&<>"'\t\r\n ]/g, m => htmlSpecialChars[m])
;

const makeArray = (x, path) => `
  [<ul ${pathToData(path)}>
    ${x.map((e, i) => {
      path.push(`[${i}]`);
      const html = `<li ${pathToData(path)}>
        ${pathify(e, path).trim()},
      </li>`;
      path.pop();
      return html;
    }).join("")}
  </ul>]
`;
const makeObj = (x, path) => `
  {<ul ${pathToData(path)}>
    ${Object.entries(x).map(([k, v]) => {
      path.push(keyToStr(k));
      const html = `<li ${pathToData(path)}>
        "${toHTML(k)}": ${pathify(v, path).trim()},
      </li>`;
      path.pop();
      return html;
    }).join("")}
  </ul>}
`;

const pathify = (x, path=[]) => {
  if (Array.isArray(x)) {
    return makeArray(x, path);
  }
  else if (typeof x === "object" && x !== null) {
    return makeObj(x, path);
  }
  
  return toHTML(typeof x === "string" ? `"${x}"` : x);
};

const defaultJSON = `{
  "corge": "test JSON... \\n   asdf\\t asdf",
  "foo-bar": [
    {"id": 42},
    [42, {"foo": {"baz": {"ba  r<>!\\t": true, "4quux": "garply"}}}]
  ]
}`;

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const resultEl = $("#result");
const pathEl = $("#path");

const tryToJSON = v => {
  try {
    resultEl.innerHTML = pathify(JSON.parse(v));
    $("#error").innerText = "";
  }
  catch (err) {
    resultEl.innerHTML = "";
    $("#error").innerText = err;
  }
};

const copyToClipboard = text => {
  const ta = document.createElement("textarea");
  ta.innerText = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
};

const flashAlert = (text, timeoutMS=2000) => {
  const alert = document.createElement("div");
  alert.textContent = text;
  alert.classList.add("alert");
  document.body.appendChild(alert);
  setTimeout(() => alert.remove(), timeoutMS);
};

const handleClick = e => {
  e.stopPropagation();
  copyToClipboard(e.target.dataset.path);
  flashAlert("copied!");
  $("#path-out").textContent = e.target.dataset.path;
};

const handleMouseOut = e => {
  lastHighlighted.style.background = "transparent";
  pathEl.style.display = "none";
};

const handleMouseOver = e => {
  pathEl.textContent = e.target.dataset.path;
  pathEl.style.left = `${e.pageX + 30}px`;
  pathEl.style.top = `${e.pageY}px`;
  pathEl.style.display = "block";
  lastHighlighted.style.background = "transparent";
  lastHighlighted = e.target.closest("li");
  lastHighlighted.style.background = "#0ff";
};

const handleNewJSON = e => {
  tryToJSON(e.target.value);
  [...$$("#result *")].forEach(e => {
    e.addEventListener("click", handleClick);
    e.addEventListener("mouseout", handleMouseOut);
    e.addEventListener("mouseover", handleMouseOver);
  });
};
$("textarea").addEventListener("change", handleNewJSON);
$("textarea").addEventListener("keyup", handleNewJSON);
$("textarea").value = defaultJSON;
$("#brackets").addEventListener("change", e => {
  bracketsOnly = !bracketsOnly;
  handleNewJSON({target: {value: $("textarea").value}});
});
handleNewJSON({target: {value: defaultJSON}});
