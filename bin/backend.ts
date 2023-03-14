#!/usr/bin/env node
import { TravelStack } from '../lib/TravelStack'

import 'source-map-support/register'
import { createStack } from './createStack'

createStack(TravelStack)
