// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1 - DONE
const { chromium } = require("playwright");
const { argv } = require('node:process');
var fileSteam = require('fs');

// Two approaches to the script for ease of maintenance, have the options at the top or load them in as parameters 
// to the sript.
// I have elected to keep them at the top. But feed them into the function in case this will change in the future.
const HACKER_NEW_SITE_URL = "https://news.ycombinator.com/";
const AMOUNT_OF_ARTICLES_TO_SAVE = 10;
const CSV_SAVE_LOCATION = "hacker_news_articles.csv";
var DEBUG_OUTPUT = false;

function printDebug(msg)
{
  if (DEBUG_OUTPUT)
    console.debug(msg);
}

console.log(`${argv[1]}`);

async function saveHackerNewsArticles(entryAmount = 0, csvSaveLocation="output.csv") {
  /**
   * function saveHackerNewsArticles.
   *
   * Saved news articles from hackerNews. Defaults to saving all the articles in a csv to output.csv
   *
   * @parm {number} entryAmount     Amount of article entries to save.
   * @parm {number} csvSaveLocation Save location for the results in a csv file format.
   */

  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto(HACKER_NEW_SITE_URL);

  // collection container for the articles
  var collectArticleArray = [];

  // get all title rows (titles have lots of links).
  var titleInfoRow = await page.locator('tr[class="athing"] td[class="title"] span[class="titleline"]').all();

  for (const titleRow of titleInfoRow)
    {
      // Grab the first link, that is the article.
      linkElement = await titleRow.locator('a').first();
      var title = await linkElement.textContent();
      var itemHref = await linkElement.getAttribute('href');
      printDebug("Found entry " + (collectArticleArray.length + 1) + ": " + title + " - " + itemHref);
      collectArticleArray.push([title, itemHref]);
      printDebug("Added entry to array");
      // if entry amount is 0 its a flag to get all the entries.
      if (entryAmount != 0 && collectArticleArray.length >= entryAmount)
      {
        printDebug("Amount found reached. Finish looping.");
        break;
      }
    }

  // Reason why we do collection sepperate from saving as browser elements can get stale. 
  // We want to extract quickly.

  // We are done with browser close it off.
  browser.close();
  printDebug("Browser closed");

  function failedToWriteToFile(err)
  {
    if (err) {
      console.error(err);
    } else{
      console.log('Found articles saved to: ' + csvSaveLocation);
    }
  }

  // Check if we found any articles.
  if (collectArticleArray.length > 0)
    {
      csvFieldHeader = '"Title","URL"\n';
      csvFileContent = "";
      // Convert our entries into a csv file.
      collectArticleArray.forEach(article => {
        // properly escape "" in csv
        article[0] = article[0].replace('"', '""');
        article[1] = article[1].replace('"', '""');
        csvFileContent = csvFileContent + '"' + article[0] + '","' + article[1] + '"\n';
      });
      printDebug("Array converted to csv string");
      fileSteam.writeFile(csvSaveLocation, csvFieldHeader + csvFileContent, 'utf8', failedToWriteToFile);
    } else {
      emptyArticleListErrorMsg = 
      "ERR: We did not find any articles!\n" +
      "Connection may have timed out, the selector may have changed, " +
      "the url may have changed or wrong url may have been used.\n" +
      "Please check the script before trying again."
      console.error(emptyArticleListErrorMsg);
    }
}

// Driver of the script
(async () => {
  // Check if debug flag is added
  if (argv.length == 3 && argv[2].toLowerCase() == "debug")
    {
      console.debug("Debug output is on...");
      DEBUG_OUTPUT = true;
    }
  // If we have a specific location use that instead of the default.
  if (CSV_SAVE_LOCATION)
    await saveHackerNewsArticles(AMOUNT_OF_ARTICLES_TO_SAVE, CSV_SAVE_LOCATION);
  else
    await saveHackerNewsArticles(AMOUNT_OF_ARTICLES_TO_SAVE);
})();
