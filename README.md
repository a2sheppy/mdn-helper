# mdn-helper
Removes repetitive work of creating MDN markup and text. Much of the work of creating a new MDN reference page is in creating  boilerplate such as headings, specification tables, and standardized intro text. Once this is created API specific content must be added to the boilerplate. A significant portion of that content is duplicated between one or more pages of the API.

This tool simplifies this process. First, it takes a command line indicating the interfaces and members to be created. It then prompts the answers to API specific content. It combines those answers with templates and writes nearly complete pages ready for pasting directly into the MDN page editor.

The current version only handles JavaScript APIs.

## Installation

1. Install [node.js](https://nodejs.org).

1. Clone this repository.

   `git clone https://github.com/jpmedley/mdn-helper.git`

1. Change to the `mdn-helper` directory and run `npm install`.

1. (Optional) Add an alias for it to your .bashrc file. For example:

   `alias mdn-helper='node *path/to*/mdn-helper/index.js'`

## Usage

From within the mdn-helper direcory:

  `node index.js <command> [<arguments>]`

Using the optional bash alias:

  `mdn-helper <command> [<arguments>]`

## Commands

### css

Creates a pages for CSS selectors. The results are written to the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `css -n _selectorName_`

### header

Creates pages for HTTP headers. The results are written to the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `header -n _headerName_ [-h] [(-d | --directive) _directiveName_]`

**Flags**

* `-n`: The name of the header being documented. This flag provides the header\'s name for use in directive pages. It does not create an interface page.
* `-h`: (Optional) Indicates that a *header* page should be created. If this flag is absent only directive pages will be created.
* `-d` or `--directive`: (Optional) The name of a directive being documented. This flag may be repeated as needed.

### interface

Creates pages for JavaScript platform APIs. The results are written to the `*path/to*/mdn-helper/out/` directory.

**Syntax:** `interface -n _interfaceName_ [-o] [-i] [-c] [(-m | --method) _methodName_] [(-p | --property) _propertyName_]`

**Flags:**

* `-n`: The name of the interface being documented. This flag provides the interface\'s name for use in member pages. It does not create an overview, interface, or constructor page.
* `-o`: (Optional) Indicates that an *overview* page should be created.
* `-i`: (Optional) Indicates that an *interface* page should be created.
* `-c`: (Optional) Indicates that a *constructor* page should be created.
* `-m` or `--method`: (Optional) Indicates *method* page should be created with the specified name. This flag may be repeated as needed.
* `-p` or `--property`: (Optional) Indicates *property* page should be created with the specified name. This flag may be repeated as needed.

### clean

Empties the `/out` directory.

### help

Prints help text to the console.

## Examples

**Create an interface page only**

`node index.js interface -n Widget -i`

**Create an interface page and a constructor page**

`node index.js interface -n Widget -i -c`

**Create a method page without its interface**

`node index.js interface -n Widget -m "doStuff()"`

**Create an interface page and two members**

`node index.js interface -n Widget -m "doStuff()" -p isReady`
