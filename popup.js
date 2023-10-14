"use strict";
let data = [];

async function updateTable() {
  const tab = await getTab();
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => document.documentElement.outerHTML
  })
  .then((results) => {
    const result = results[0].result;
    data = parse(result, tab);

    // show data in table
    const tableBody = document.getElementById("tbody");
    tableBody.replaceChildren();
    data.forEach((row) => {
      const newRow = tableBody.insertRow(-1);
      row.forEach((el) => {
        const newCell = newRow.insertCell();
        newCell.innerText = el;
      });
    })
  });
}
updateTable();

document.getElementById("exportBtn").addEventListener("click", async () => {
  const csvContent = arrayToCsv(data);
  downloadBlob(csvContent, 'export.csv', 'text/csv;charset=utf-8;');
});

let includeA = false;
document.getElementById("a-checkbox").addEventListener("change", (e) => {
  if (e.target.checked == true) {
    includeA = true;
  }
  else {
    includeA = false;
  }
  updateTable();
});

async function getTab() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  return tabs[0];
}

function parse(source, tab) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'text/html');
  const results = getTags(doc, tab);
  return results;
}

function arrayToCsv(data){
  return data.map(row =>
    row
    .map(String)  // convert every value to String
    .map(v => v.replaceAll('"', '""'))  // escape double quotes
    .map(v => `"${v}"`)  // quote it
    .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

function downloadBlob(content, filename, contentType) {
  // Create a blob
  var blob = new Blob([content], { type: contentType });
  var url = URL.createObjectURL(blob);

  // Create a link to download it
  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

function getTag(doc, name, selector, attr) {
  let arr = [];
  try {
    const elements = doc.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i].tagName);
      arr.push([name, elements[i][attr]]);
    }
  }
  catch (err) {
    console.log(err);
    console.log(`error finding ${name}`);
  }
  return arr;
}

function getTags(doc, tab) {
  let results = [
    ["Query Submission"],
    ["URL", tab.url],
    ["LANG", ""],
    [""],
    ["Essential Meta Tags"],
    ["Title",""],
    ["Meta Title", ""],
    ["Meta Description", ""],
    ["Canonical URL", ""],
    [""],
    ["Social Media Meta Tags"],
    ["og:description",""],
    ["og:image", ""],
    ["og:title", ""],
    ["og:type",""],
    ["og:URL",""],
    ["",""],
    ["twitter:card", ""],
    ["twitter:description", ""],
    ["twitter:image", ""],
    ["twitter:site", ""],
    ["twitter:title", ""],
    ["",""],
    ["Body Content"]
  ]
  let selectors = [
    'html',
    'meta',
    'title',
    // 'meta[name="title"]',
    // 'meta[property="title"]',
    // 'meta[name="description"]',
    // 'meta[property="description"]',
    // 'meta[name="og:image"]',
    // 'meta[property="og:image"]',
    // 'meta[name="og:image:alt"]',
    // 'meta[property="og:image:alt"]',
    // 'meta[name="og:type"]',
    // 'meta[property="og:type"]',
    // 'meta[name="og:title"]',
    // 'meta[property="og:title"]',
    // 'meta[name="og:description"]',
    // 'meta[property="og:description"]',
    'link[rel="canonical"]',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
  ];
  console.log("includeA",includeA);
  if (includeA == true) {
    selectors.push('a');
  }
  const elements = doc.querySelectorAll(selectors.join(", "))
  for (let i = 0; i < elements.length; i++) {
    const tagName = elements[i].tagName.toLowerCase();
    let name;
    let value;
    let value2;
    let requiredValue = false;
    if (tagName === "meta") {
      let metaType;
      if (elements[i].getAttribute("name") != null) {
        metaType = elements[i].getAttribute("name");
      }
      else if(elements[i].getAttribute("property") != null) {
        metaType = elements[i].getAttribute("property");
      }
      else {
        continue;
      }
      console.log(metaType.toLowerCase());
      switch(metaType.toLowerCase()) {
        case "title":
          name = "Meta Title";
          break;
        case "description":
          name = "Meta Description";
          break;
        case "og:image":
          name = "og:image";
          break;
        case "og:description":
          name = "og:description";
          break;
        case "og:title":
          name = "og:title";
          break;
        case "og:type":
          name = "og:type";
          break;
        case "og:url":
          name = "og:url";
          break;
        case "twitter:card":
          name = "twitter:card";
          break;
        case "twitter:title":
          name = "twitter:title";
          break;
        case "twitter:description":
          name = "twitter:description";
          break;
        case "twitter:image":
          name = "twitter:image"
          break;
        case "twitter:site":
          name = "twitter:site";
          break;
        default:
          continue;
      }
      value = elements[i].content;
      requiredValue = true;
    }
    else if (tagName == "title") {
      name = "Title";
      value = elements[i].innerText;
      requiredValue = true;
    }
    else if (tagName == "p" || tagName == "h1" || tagName == "h2" || tagName == "h3" || tagName == "h4" || tagName == "h5" || tagName == "h6"){
      name = tagName;
      value = elements[i].innerText;
    }
    // link doesnt have to be canon here!! could be something else
    else if (tagName == "link") {
      name = "Canonical URL"
      value = elements[i].href;
      requiredValue = true;
    }
    else if (tagName == "img") {
      name = "img";
      value = elements[i].src.replace("chrome-extension://cchkopnegjlfcookgebmkoocninlodlm/", tab.url);

      if ("alt" in elements[i]) {
        value2 = elements[i].alt;
      }
    }
    else if (tagName == "a") {
      name = "a";
      value = elements[i].innerText;
      value2 = elements[i].href.replace("chrome-extension://cchkopnegjlfcookgebmkoocninlodlm/", tab.url);
    }
    else if (tagName == "html") {
      name = "LANG";
      value = elements[i].lang;
      requiredValue = true;
    }
    else {
      console.log(`tagName ${tagName} not covered`);
      continue;
    }
    if (requiredValue) {
      for (let i = 0; i < results.length; i++) {
        if (results[i][0] == name) {
          results[i][1] = value;
          break;
        }
      }
    }
    else {
      if (value2) {
        results.push([name, value, value2]);
      }
      else {
        results.push([name, value]);
      }
    }
  }
  return results;
}