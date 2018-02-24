# Page Check
Webpage tester based on PhantomJS and Node.js



Module runs your webpage, app or banner within PhantomJS. While running, it registers next few things:
- javascript errors (including errors inside `window.onresize` handler)
- missing files
- console events (`.log()`, `.warn()`, etc.)
- requesting files from different host


## Usage
```javascript
const PageCheck = require('page-check');

PageCheck('http://localhost:8000/test')
.then(result => {
   console.log(JSON.stringify(result, true, 2));
}, err => {
   console.log(JSON.stringify(err, true, 2));
});
```



## Options

### link 
__Type__: *String*<br>


### options 
__Type__: *Object*, *Number*<br>

If a `Number`, then acts like `timeout` option


### options.filter
__Type__: *Function*<br>

This function will be used by `Array.filter()` to filter final list of errors.<br>
For example we could leave only `js errors` and `missing files`:<br>

```javascript
PageCheck('http://localhost:8000/test', {
   filter: err => /[12]/.test(err.code)
})
```



### options.no_clones
__Type__: *Boolean*<br>
__Default__: *false*<br> 

If set to `true`, the same errors will be removed from the list


### timeout 
__Type__: *Number*<br>
__Default__: `60`<br>

Keep checking for this amout of seconds




## Output
```
{
  "status": "done",
  "link": "http://localhost:8000/test",
  "errors": [
    {
      "code": 1,
      "type": "js error",
      "details": "ReferenceError: Can't find variable: git",
      "line": "line 138"
    },
    {
      "code": 2,
      "type": "missing file",
      "details": "Error downloading http://localhost:8000/test/style.css",
      "line": ""
    },
    {
      "code": 3,
      "type": "console",
      "details": "yey!",
      "line": ""
    },
    {
      "code": 4,
      "type": "external request",
      "details": "https://google.com/logo.png",
      "line": ""
    }
  ]
}
```






