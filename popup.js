"use strict";

async function getTabId() {
  const tabs = await chrome.tabs.query({active: true})
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
  let arr = [["Element", "Value"]];
  tags.forEach((item) => {
    arr = arr.concat(getTag(doc, item[0], item[1], item[2]));
  });
  console.log(arr);

  let csvContent = arrayToCsv(arr);

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
      arr.push([name, elements[i][attr]]);
    }
  }
  catch (err) {
    console.log(err);
    console.log(`error finding ${name}`);
  }
  return arr;
}