const fs = require('fs')

const NPMSIO = 'https://api.npms.io/v2/search/?q=jsonresume-theme&size=250&from='
const STEM = new Object
const THEMES = new Object
const FILE = 'themes.json'
var deprecated = 0
var unstable = 0
var totalFound = 0
var processed = 0

// Retrieve list of all jsonresume-STEM on NPMS.IO
async function doAPI(url,from) {
  try {
    // Using built-in fetch
    const response = await fetch(url+from)
      .then((res) => res.json())
    // Take result and push it to an object
    await Object.assign(STEM, response.results)
    // Take result and push list of package names to an array
    var res = await response.results
    totalFound = response.total
    Object.entries(res).forEach(([key, value]) => {
      // Toss out deprecated packages
      if (res[key].flags) {
        if (res[key].flags.deprecated) {
          console.log('DEPRECATED: ' + res[key].package.name)
          deprecated++
          return
        } else if (res[key].flags.unstable) {
          // Track unstable, but still add
          unstable++
        }
      }

      let num = res[key]
      let author = ""
      let homeurl = ""
      let npm = res[key].package.links.npm
      let name = res[key].package.name
      
      if (res[key].package.author) {
        if (res[key].package.author.name) {
          author = res[key].package.author.name
        }
      }

      if (res[key].package.links.homepage) {
        homeurl = res[key].package.links.homepage
      }

      THEMES[processed] = new Object
      THEMES[processed].name = name
      THEMES[processed].npm = npm
      THEMES[processed].author = author
      THEMES[processed].homeurl = homeurl
      processed++
    });
    // Toss back total found
    return response.total
  } catch (error) {
    console.error(error)
  }
}

// Loop to make additional API calls to satisfy total
async function loopAPI(data) {
  try {
    for (let from=250; from < data; from = from + 250) {
      await doAPI(NPMSIO,from)
    }
  } catch (error) {
    console.error(error)
  }
}

// Write captured list to local file
async function doWriteFile(fileName) {
  try {
    const jsonString = await JSON.stringify(THEMES, null, 2)
    fs.writeFile(fileName, jsonString, (error) => {
      if (error) {
        console.log(error)
      } else {
        console.log("File Written")
        console.log("Total Found: " + totalFound + " Deprecated: " + deprecated + " Unstable: " + unstable + " Processed: " + processed)
      }
    })
  } catch (error) {
    console.error(error)
  }
}

// Main event loop
async function getThemes(fileName) {
  // Initial API call. Separate from others so that we can grab the total number of iterations needed in the loop
  const data = await doAPI(NPMSIO,0)
  // Now we can pass response.results as a value to iterate over
  await loopAPI(data)
  // Write all values to file
  await doWriteFile(FILE)
}

exports.getThemes = getThemes