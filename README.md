# Page Check
Webpage tester based on Puppeteer and Node.js



Module runs your webpage, app or banner within virtual browser. While running, it registers next few things:
- javascript errors (including errors inside `onresize` handler)
- missing files
- console events (`log`, `warn`, etc.)
- requests to a different hosts



## Installation
```bash
npm install page-check
```



## API

### PageCheck(link[, options])

### link   
**Type**: _String_   


### options.timeout 
**Type**: _Number_   
**Default**: `60`     
Keep checking for this amout of seconds


### options.clones
**Type**: _Boolean_   
**Default**: `false`     
If set to `false`, the same errors will be removed from the list


### options.filter   
**Type**: _Function_     
This function will be used by `Array.filter()` to filter final list of errors.     
For example we could leave only `js errors` and `external request`:    

Here is the codes for quick filtering:

| Code | Event |
| :------: | ------ |
| 1 | page error |
| 2 | failed request |
| 3 | external request |
| 4 | console.log |
| 5 | console.error |
| 6 | console.warn, console.info ... |
| 7 | dialog, alert ... | 


### options.headless    
**Type**: _Boolean_     
**Default**: `true`  


### options.devtools    
**Type**: _Boolean_   
**Default**: `false`  




## Usage
```javascript
const PageCheck = require('page-check');

let results = await PageCheck('http://localhost:1234/test/js-error', {
   timeout: 3, 
   clones: true,
   filter: err => /[1234]/.test(err.code)
});

console.log(JSON.stringify(results, true, 2));
```




## Output
```
[
 {
   "code": 1,
   "type": "page error",
   "details": "ReferenceError: Can't find variable: git"
 },
 {
   "code": 2,
   "type": "request failed",
   "details": "Error downloading http://localhost:8000/test/style.css",
   "line": ""
 },
 {
   "code": 4,
   "type": "console.log",
   "details": "yey!"
 },
 {
   "code": 3,
   "type": "external request",
   "details": "https://google.com/logo.png"
 }
]
```





## Changelog 
#### v2.0.0 (2018-08-26):
- moved from unmaintained PhantomJS to Puppeteer




