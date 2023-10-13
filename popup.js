"use strict";
let data = [];
(async () => {
  const tab = await getTab();
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: () => document.documentElement.outerHTML
  })
  .then((results) => {
    console.log(tab);
    const result = results[0].result;
    data = parse(result, tab);

    // show data in table
    const tableBody = document.getElementById("tbody");
    data.forEach((row) => {
      console.log(row);
      const newRow = tableBody.insertRow(-1);
      row.forEach((el) => {
        const newCell = newRow.insertCell();
        newCell.innerText = el;
      })
    })
  });
})();

document.getElementById("exportBtn").addEventListener("click", async () => {
  const csvContent = arrayToCsv(data);
  downloadBlob(csvContent, 'export.csv', 'text/csv;charset=utf-8;');
});

async function getTab() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true})
  console.log(tabs);
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
  let results = [["Name", "Value"]];
  let selectors = [
    'meta[name="title"]',
    'meta[property="title"]',
    'meta[name="description"]',
    'meta[property="description"]',
    'meta[name="og:image"]',
    'meta[property="og:image"]',
    'meta[name="og:image:alt"]',
    'meta[property="og:image:alt"]',
    'meta[name="og:type"]',
    'meta[property="og:type"]',
    'meta[name="og:title"]',
    'meta[property="og:title"]',
    'meta[name="og:description"]',
    'meta[property="og:description"]',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'img',
    'a'
  ];
  const elements = doc.querySelectorAll(selectors.join(", "))
  for (let i = 0; i < elements.length; i++) {
    const tagName = elements[i].tagName.toLowerCase();
    let name;
    let value;
    let value2;
    if (tagName === "meta") {
      let metaType;
      if (elements[i].getAttribute("name") != null) {
        metaType = elements[i].getAttribute("name");
      }
      else if(elements[i].getAttribute("property") != null) {
        metaType = elements[i].getAttribute("property");
      }
      switch(metaType) {
        case "title":
          name = "meta title";
          break;
        case "description":
          name = "meta description";
          break;
        case "og:image":
          name = "og:image";
          break;
        case "og:image:alt":
          name = "og:image:alt";
          break;
        case "og:description":
          name = "og:description";
          break;
        case "og:title":
          name = "og:title";
          break;
        case "og:type":
          name = "og:type"
          break;
      }
      value = elements[i].content;
    }
    else if (tagName == "title") {
      name = tagName; 
      value = elements[i].innerText;
    }
    else if (tagName == "p" || tagName == "h1" || tagName == "h2" || tagName == "h3" || tagName == "h4" || tagName == "h5" || tagName == "h6"){
      name = tagName;
      value = elements[i].innerText;
    }
    // link doesnt have to be canon here!! could be something else
    else if (tagName == "link") {
      name = "canonical"
      value = elements[i].href;
    }
    else if (tagName == "img") {
      name = "img";
      value = elements[i].src;
      if ("alt" in elements[i]) {
        value2 = elements[i].alt;
      }
    }
    else if (tagName == "a") {
      name = "a";
      value = elements[i].innerText;
      value2 = elements[i].href.replace("chrome-extension://cchkopnegjlfcookgebmkoocninlodlm/", tab.url);
    }
    else {
      console.log(`tagName ${tagName} not covered`);
      continue;
    }

    if (value2) {
      results.push([name, value, value2]);
    }
    else {
      results.push([name, value]);
    }
  }
  return results;
}