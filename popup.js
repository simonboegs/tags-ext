"use strict";

async function getTabId() {
  const tabs = await chrome.tabs.query({active: true, lastFocusedWindow: true})
  console.log(tabs.length)
  return tabs[0].id
}

function getTitle() {
  return document.documentElement.outerHTML;
}

document.getElementById("exportBtn").addEventListener("click", async () => {
  console.log("print");
  const tabId = await getTabId();
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    func: getTitle
  })
  .then((results) => {
    const result = results[0].result;
    parse(result);
  });
});


function parse(source) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'text/html');
  const tags = [
    ["title", 'title', "innerText"],
    ["link", 'link[rel="canonical"]', "href"],
    ["meta title", 'meta[name="title"]', "content"],
    ["meta description", 'meta[name="description"]', "content"],
    ["og:image", 'meta[name="og:image"], meta[property="og:image"]', "content"],
    ["og:description", 'meta[name="og:description"], meta[property="og:description"]', "content"],
    ["og:type", 'meta[name="og:type"], meta[property="og:type"]', "content"],
    ["og:image:alt", 'meta[name="og:image:alt"], meta[property="og:image:alt"]', "content"],
    ["h1", "h1", "innerText"],
    ["h2", "h2", "innerText"],
    ["h3", "h3", "innerText"],
    ["h4", "h4", "innerText"],
    ["h5", "h5", "innerText"],
    ["h6", "h6", "innerText"],
    ["p", "p", "innerText"],
  ];
  // we have tags as the keys.... but there are multiple tags OBV
  // are there any tags where we might want different properties?
  // we definitely want names
  const results = getTags(doc);

  const csvContent = arrayToCsv(results);

  downloadBlob(csvContent, 'export.csv', 'text/csv;charset=utf-8;');
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

function getTags(doc) {
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
    'h6'
  ];
  const elements = doc.querySelectorAll(selectors.join(", "))
  for (let i = 0; i < elements.length; i++) {
    const tagName = elements[i].tagName.toLowerCase();
    let name;
    let value;
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
    else if (tagName == "link") {
      name = "canonical"
      value = elements[i].href;
    }
    else {
      console.log(`tagName ${tagName} not covered`);
      continue;
    }
    results.push([name, value]);
  }
  return results;
}