'use strict'

const parseDateTime = require('../parse/date-time')
const parseDeparture = require('../parse/departure')
const parseJourney = require('../parse/journey')
const parseLine = require('../parse/line')
const parseLocation = require('../parse/location')
const parseMovement = require('../parse/movement')
const parseNearby = require('../parse/nearby')
const parseOperator = require('../parse/operator')
const parseRemark = require('../parse/remark')
const parseStopover = require('../parse/stopover')

const formatAddress = require('../format/address')
const formatCoord = require('../format/coord')
const formatDate = require('../format/date')
const filters = require('../format/filters')
const formatLocationFilter = require('../format/location-filter')
const formatPoi = require('../format/poi')
const formatStation = require('../format/station')
const formatTime = require('../format/time')

const id = x => x

// todo: find out which are actually necessary
const defaultProfile = {
	transformReqBody: id,
	transformReq: id,

	parseDateTime,
	parseDeparture,
	parseJourney,
	parseLine,
	parseLocation,
	parseMovement,
	parseNearby,
	parseOperator,
	parseRemark,
	parseStopover,

	formatAddress,
	formatCoord,
	formatDate,
	filters,
	formatLocationFilter,
	formatPoi,
	formatStation,
	formatTime
}

module.exports = defaultProfile