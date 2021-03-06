# ÖBB profile for `hafas-client`

[*Österreichische Bundesbahnen (ÖBB)*](https://en.wikipedia.org/wiki/Austrian_Federal_Railways) is the largest Austrian long-distance public transport company. This profile adds *ÖBB*-specific customizations to `hafas-client`. Consider using [`oebb-hafas`](https://github.com/juliuste/oebb-hafas#oebb-hafas), to always get the customized client right away.

## Usage

```js
const createClient = require('hafas-client')
const oebbProfile = require('hafas-client/p/oebb')

// create a client with ÖBB profile
const client = createClient(oebbProfile)
```


## Customisations

- parses *ÖBB*-specific products (such as *RailJet*)
- parses invalid empty stations from the API as [`location`](https://github.com/public-transport/friendly-public-transport-format/blob/1.0.1/spec/readme.md#location-objects)s
