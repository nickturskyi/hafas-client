'use strict'

// todo
// const getStations = require('db-stations').full
const tapePromise = require('tape-promise').default
const tape = require('tape')
const isRoughlyEqual = require('is-roughly-equal')
const validateFptf = require('validate-fptf')

const validateLineWithoutMode = require('./validate-line-without-mode')

const co = require('./co')
const createClient = require('..')
const nahshProfile = require('../p/nahsh')
const allProducts = require('../p/nahsh/products')
const {
	assertValidStation,
	assertValidPoi,
	assertValidAddress,
	assertValidLocation,
	assertValidStopover,
	hour, createWhen, assertValidWhen
} = require('./util.js')

const when = createWhen('Europe/Berlin', 'de-DE')

const assertValidStationProducts = (t, p) => {
	t.ok(p)
	t.equal(typeof p.nationalExp, 'boolean')
	t.equal(typeof p.national, 'boolean')
	t.equal(typeof p.interregional, 'boolean')
	t.equal(typeof p.regional, 'boolean')
	t.equal(typeof p.suburban, 'boolean')
	t.equal(typeof p.bus, 'boolean')
	t.equal(typeof p.ferry, 'boolean')
	t.equal(typeof p.subway, 'boolean')
	t.equal(typeof p.tram, 'boolean')
	t.equal(typeof p.onCall, 'boolean')
}

const isKielHbf = (s) => {
	return s.type === 'station' &&
	(s.id === '8000199') &&
	s.name === 'Kiel Hbf' &&
	s.location &&
	isRoughlyEqual(s.location.latitude, 54.314982, .0005) &&
	isRoughlyEqual(s.location.longitude, 10.131976, .0005)
}

const assertIsKielHbf = (t, s) => {
	t.equal(s.type, 'station')
	t.ok(s.id === '8000199', 'id should be 8000199')
	t.equal(s.name, 'Kiel Hbf')
	t.ok(s.location)
	t.ok(isRoughlyEqual(s.location.latitude, 54.314982, .0005))
	t.ok(isRoughlyEqual(s.location.longitude, 10.131976, .0005))
}

// todo: DRY with assertValidStationProducts
// todo: DRY with other tests
const assertValidProducts = (t, p) => {
	for (let product of allProducts) {
		product = product.product // wat
		t.equal(typeof p[product], 'boolean', 'product ' + p + ' must be a boolean')
	}
}

const assertValidPrice = (t, p) => {
	t.ok(p)
	if (p.amount !== null) {
		t.equal(typeof p.amount, 'number')
		t.ok(p.amount > 0)
	}
	if (p.hint !== null) {
		t.equal(typeof p.hint, 'string')
		t.ok(p.hint)
	}
}

const assertValidLine = (t, l) => { // with optional mode
	const validators = Object.assign({}, validateFptf.defaultValidators, {
		line: validateLineWithoutMode
	})
	const recurse = validateFptf.createRecurse(validators)
	try {
		recurse(['line'], l, 'line')
	} catch (err) {
		t.ifError(err)
	}
}

const test = tapePromise(tape)
const client = createClient(nahshProfile)

const kielHbf = '8000199'
const flensburg = '8000103'
const luebeckHbf = '8000237'
const husum = '8000181'
const schleswig = '8005362'

test('Kiel Hbf to Flensburg', co(function* (t) {
	const journeys = yield client.journeys(kielHbf, flensburg, {
		when, passedStations: true
	})

	t.ok(Array.isArray(journeys))
	t.ok(journeys.length > 0, 'no journeys')
	for (let journey of journeys) {
		t.equal(journey.type, 'journey')

		t.ok(Array.isArray(journey.legs))
		t.ok(journey.legs.length > 0, 'no legs')
		const leg = journey.legs[0] // todo: all legs

		assertValidStation(t, leg.origin)
		assertValidStationProducts(t, leg.origin.products)
		// todo
		// if (!(yield findStation(leg.origin.id))) {
		// 	console.error('unknown station', leg.origin.id, leg.origin.name)
		// }
		assertValidWhen(t, leg.departure, when)
		t.equal(typeof leg.departurePlatform, 'string')

		assertValidStation(t, leg.destination)
		assertValidStationProducts(t, leg.origin.products)
		// todo
		// if (!(yield findStation(leg.destination.id))) {
		// 	console.error('unknown station', leg.destination.id, leg.destination.name)
		// }
		assertValidWhen(t, leg.arrival, when)
		t.equal(typeof leg.arrivalPlatform, 'string')

		assertValidLine(t, leg.line)

		t.ok(Array.isArray(leg.passed))
		for (let stopover of leg.passed) assertValidStopover(t, stopover)

		if (journey.price) assertValidPrice(t, journey.price)
	}

	t.end()
}))

test('Kiel Hbf to Husum, Zingel 10', co(function* (t) {
	const zingel = {
		type: 'location',
		latitude: 54.475359,
		longitude: 9.050798,
		address: 'Husum, Zingel 10'
	}

	const journeys = yield client.journeys(kielHbf, zingel, {when})

	t.ok(Array.isArray(journeys))
	t.ok(journeys.length >= 1, 'no journeys')
	const journey = journeys[0]
	const firstLeg = journey.legs[0]
	const lastLeg = journey.legs[journey.legs.length - 1]

	assertValidStation(t, firstLeg.origin)
	assertValidStationProducts(t, firstLeg.origin.products)
	// todo
	// if (!(yield findStation(leg.origin.id))) {
	// 	console.error('unknown station', leg.origin.id, leg.origin.name)
	// }
	if (firstLeg.origin.products) assertValidProducts(t, firstLeg.origin.products)
	assertValidWhen(t, firstLeg.departure, when)
	assertValidWhen(t, firstLeg.arrival, when)
	assertValidWhen(t, lastLeg.departure, when)
	assertValidWhen(t, lastLeg.arrival, when)

	const d = lastLeg.destination
	assertValidAddress(t, d)
	t.equal(d.address, 'Husum, Zingel 10')
	t.ok(isRoughlyEqual(.0001, d.latitude, 54.475359))
	t.ok(isRoughlyEqual(.0001, d.longitude, 9.050798))

	t.end()
}))

test('Holstentor to Kiel Hbf', co(function* (t) {
	const holstentor = {
		type: 'location',
		latitude: 53.866321,
		longitude: 10.679976,
		name: 'Hansestadt Lübeck, Holstentor (Denkmal)',
		id: '970003547'
	}
	const journeys = yield client.journeys(holstentor, kielHbf, {when})

	t.ok(Array.isArray(journeys))
	t.ok(journeys.length >= 1, 'no journeys')
	const journey = journeys[0]
	const firstLeg = journey.legs[0]
	const lastLeg = journey.legs[journey.legs.length - 1]

	const o = firstLeg.origin
	assertValidPoi(t, o)
	t.equal(o.name, 'Hansestadt Lübeck, Holstentor (Denkmal)')
	t.ok(isRoughlyEqual(.0001, o.latitude, 53.866321))
	t.ok(isRoughlyEqual(.0001, o.longitude, 10.679976))

	assertValidWhen(t, firstLeg.departure, when)
	assertValidWhen(t, firstLeg.arrival, when)
	assertValidWhen(t, lastLeg.departure, when)
	assertValidWhen(t, lastLeg.arrival, when)

	assertValidStation(t, lastLeg.destination)
	assertValidStationProducts(t, lastLeg.destination.products)
	if (lastLeg.destination.products) assertValidProducts(t, lastLeg.destination.products)
	// todo
	// if (!(yield findStation(leg.destination.id))) {
	// 	console.error('unknown station', leg.destination.id, leg.destination.name)
	// }

	t.end()
}))

test('Husum to Lübeck Hbf with stopover at Husum', co(function* (t) {
	const [journey] = yield client.journeys(husum, luebeckHbf, {
		via: kielHbf,
		results: 1,
		when
	})

	const i1 = journey.legs.findIndex(leg => leg.destination.id === kielHbf)
	t.ok(i1 >= 0, 'no leg with Kiel Hbf as destination')

	const i2 = journey.legs.findIndex(leg => leg.origin.id === kielHbf)
	t.ok(i2 >= 0, 'no leg with Kiel Hbf as origin')
	t.ok(i2 > i1, 'leg with Kiel Hbf as origin must be after leg to it')

	t.end()
}))

test('earlier/later journeys, Kiel Hbf -> Flensburg', co(function* (t) {
	const model = yield client.journeys(kielHbf, flensburg, {
		results: 3, when
	})

	t.equal(typeof model.earlierRef, 'string')
	t.ok(model.earlierRef)
	t.equal(typeof model.laterRef, 'string')
	t.ok(model.laterRef)

	// when and earlierThan/laterThan should be mutually exclusive
	t.throws(() => {
		client.journeys(kielHbf, flensburg, {
			when, earlierThan: model.earlierRef
		})
	})
	t.throws(() => {
		client.journeys(kielHbf, flensburg, {
			when, laterThan: model.laterRef
		})
	})

	let earliestDep = Infinity, latestDep = -Infinity
	for (let j of model) {
		const dep = +new Date(j.legs[0].departure)
		if (dep < earliestDep) earliestDep = dep
		else if (dep > latestDep) latestDep = dep
	}

	const earlier = yield client.journeys(kielHbf, flensburg, {
		results: 3,
		// todo: single journey ref?
		earlierThan: model.earlierRef
	})
	for (let j of earlier) {
		t.ok(new Date(j.legs[0].departure) < earliestDep)
	}

	const later = yield client.journeys(kielHbf, flensburg, {
		results: 3,
		// todo: single journey ref?
		laterThan: model.laterRef
	})
	for (let j of later) {
		t.ok(new Date(j.legs[0].departure) > latestDep)
	}

	t.end()
}))
