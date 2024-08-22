import { useUserStore } from '@/store'
import { useCurrenciesStore } from '@/store/currencies'
import BigNumber from 'bignumber.js'
import Amount from './Amount'
import Currency from './Currency'

const subunits = '361888087406829731'
const units = '0.36188808740682973100'
const xlUnits = '36188808740682973100.36188808740682973100'
const usdValue = '1586.096851597843'
const currency = 'ETH'

describe('Amount value object', () => {
  let object: Amount
  describe('Constructor instantiation - new Amount', () => {
    beforeAll(() => {
      useUserStore.setState({ showBalances: true })
    })

    beforeEach(() => {
      object = new Amount(subunits, currency, usdValue)
    })

    it('should be an amount', () => {
      expect(object).toBeInstanceOf(Amount)
    })

    it('should trigger an error on invalid currency', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      object = new Amount(subunits, 'BAT' as CryptoAsset, usdValue)
      expect(consoleSpy).toHaveBeenCalledWith('Currency BAT not found')
    })

    it('should have properties', () => {
      expect(object.asBigNumber()).toBeInstanceOf(BigNumber)
      expect(object.currency).toBeInstanceOf(Currency)
    })

    it('should have correct values', () => {
      expect(object.asBigNumber().toString()).toEqual(subunits)
      expect(object.currency.symbol).toEqual('ETH')
      expect(object.fiatValue.toString()).toEqual(usdValue)
    })

    it('returns the subunit', () => {
      expect(object.asSubunit()).toEqual(subunits)
    })

    it('errors on an invalid currency', () => {
      jest.spyOn(console, 'error').mockImplementation()
      expect(new Amount(subunits, 'INVALID' as Asset).toString()).toEqual('0.3618 YLD')
      expect(console.error).toHaveBeenCalledWith('Currency INVALID not found')
    })

    it('can return a bigint', () => {
      expect(typeof object.asBigInt()).toEqual('bigint')
    })

    it('returns the fiat value as a float', () => {
      expect(object.asUSDFloat()).toEqual(1586.09)
    })

    it('should not return a fiat value for H1 currency', async () => {
      object = new Amount(subunits, 'H1')
      expect(object.asFiat()).toEqual('')
    })

    it('has a non-zero amount', () => {
      expect(object.nonZero()).toEqual(true)
    })

    it('does not have a zero amount', () => {
      expect(object.isZero()).toEqual(false)
    })

    it('returns the fiat value as a string', () => {
      expect(object.asUSD()).toEqual('$1,586.09')
    })

    it('returns the fiat value as a string with more decimals', () => {
      expect(object.asUSD(5)).toEqual('$1,586.09685')
    })

    it('returns the fiat value as a string without decimals', () => {
      object = Amount.fromDecimal(subunits, currency, '5000')
      expect(object.asUSD(2, true)).toEqual('$5,000')
    })

    it('returns the fiat value as a string with specified decimals', () => {
      expect(object.asUSD(3)).toEqual('$1,586.096')
    })

    it('returns the fiat value as a string with .00', () => {
      object = new Amount(subunits, currency, '1586.00009685843')
      expect(object.asUSD(2)).toEqual('$1,586.00')
    })

    it('returns the fiat value as a string without .00', () => {
      object = new Amount(subunits, currency, '1586.00009685843')
      expect(object.asUSD(2, true)).toEqual('$1,586')
    })

    it('displays a localised amount', () => {
      expect(object.localAmount()).toEqual('0.3618')
    })

    it('displays a string representation of the full amount', () => {
      expect(object.asValue()).toEqual('0.361888087406829731')
    })

    it('displays a localised whole number amount', () => {
      object = Amount.fromDecimal('2252.963065', 'USDT')
      expect(object.integerLocalAmount()).toEqual('2,252')
    })

    it('displays a localised whole number amount with currency', () => {
      object = Amount.fromDecimal('2252.963065', 'USDT')
      expect(object.integerLocalAmount(true)).toEqual('2,252 USDT')
    })

    it('displays a full amount that is localised', () => {
      object = Amount.fromDecimal(xlUnits, 'DAI')
      expect(object.fullLocalAmount()).toEqual('36,188,808,740,682,973,100.361888087406829731 DAI')
    })

    it('displays a fiat full amount without extra decimals', () => {
      object = Amount.fromDecimal('180.36625', 'GBP')
      expect(object.fullLocalAmount()).toEqual('£180.36')
    })

    it('displays a fiat full amount without zero padding decimals', () => {
      object = Amount.fromDecimal('180.00', 'GBP')
      expect(object.fullLocalAmount()).toEqual('£180')
    })

    it('displays a fiat full amount without one single decimal', () => {
      object = Amount.fromDecimal('180.10', 'GBP')
      expect(object.fullLocalAmount()).toEqual('£180.10')
    })

    it('displays a full amount without excess decimals', () => {
      object = Amount.fromDecimal('150000.000', 'DAI')
      expect(object.fullLocalAmount()).toEqual('150,000 DAI')
    })

    it('should be able to handle a negative amount', async () => {
      object = new Amount('-361888087406829731', currency)
      expect(object.toString()).toEqual('-0.3619 ETH')
      expect(object.isNegative()).toBeTruthy()
    })

    it('displays a string amount', () => {
      expect(object.toString()).toEqual('0.3618 ETH')
    })

    it('automatically converts to a string amount', () => {
      expect(`${object}`).toEqual('0.3618 ETH')
    })

    it('can convert to a float', () => {
      // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
      expect(object.toFloat()).toEqual(0.361888087406829731)
    })

    it('loses precision on converting to float', () => {
      expect(object.toFloat().toString()).toEqual('0.3618880874068297')
    })

    it('equates to another amount with the same currency', () => {
      expect(object.equals(Amount.fromDecimal(units, currency))).toEqual(true)
    })

    it('does not equates to another amount with a different currency', () => {
      expect(object.equals(Amount.fromDecimal(units, 'USDC'))).not.toEqual(true)
    })

    it('does not equates to another amount with a different value', () => {
      expect(object.equals(Amount.fromDecimal('0.3618', 'ETH'))).not.toEqual(true)
    })

    it('is less than a larger value', () => {
      expect(object.isLessThanValue('0.4')).toEqual(true)
    })

    it('is not less than a smaller value', () => {
      expect(object.isLessThanValue('0.3')).toEqual(false)
    })

    it('is more than a smaller value', () => {
      expect(object.isMoreThanValue('0.2')).toEqual(true)
    })

    it('is more than a larger value', () => {
      expect(object.isMoreThanValue('2')).toEqual(false)
    })

    it('multiplies by percentages', () => {
      object = Amount.fromDecimal('100', 'ETH')
      expect(object.multiplyPercentage(0.2)).toEqual('20')
    })

    it('does not create excess decimals when multiplying by percentages', () => {
      object = Amount.fromDecimal('252.063065', 'USDT')
      expect(object.multiplyPercentage(0.5)).toEqual('126.031532')
    })

    it('shows at least one significant decimal', () => {
      object = Amount.fromDecimal('0.000123', 'USDT')
      expect(object.asSignificant()).toEqual('0.0001 USDT')
    })

    it('should not mangle when using asSignificant', () => {
      object = Amount.fromDecimal('1.2', 'ETH')
      expect(object.asSignificant()).toEqual('1.2000 ETH')
    })

    it('should be able to merge amounts', () => {
      const newAmount = object.mergeAmount(object)
      expect(newAmount.toString()).toEqual('0.7237 ETH')
      expect(newAmount.asUSD()).toEqual('$3,172.19')
    })
  })

  describe('Static instantiation - Amount', () => {
    beforeEach(() => (object = Amount.fromDecimal(units, currency, usdValue)))

    it('should be an amount', () => {
      expect(object).toBeInstanceOf(Amount)
    })

    it('should have properties', () => {
      expect(object.asBigNumber()).toBeInstanceOf(BigNumber)
      expect(object.currency).toBeInstanceOf(Currency)
    })

    it('should have correct values', () => {
      expect(object.asBigNumber().toString()).toEqual(subunits)
      expect(object.currency.symbol).toEqual('ETH')
      expect(object.fiatValue.toString()).toEqual(usdValue)
    })

    it('can create an amount by resetting rate', () => {
      const amt = object.setUsdValueFromRate(1234)
      expect(amt.fiatValue.toString()).toEqual('446.569899860027888054')
    })

    it('can create an amount by multiplying', () => {
      const amt = object.multipliedBy(2)
      expect(amt.toString()).toEqual('0.7237 ETH')
    })

    it('can create an amount by dividing', () => {
      const amt = object.dividedBy(2)
      expect(amt.toString()).toEqual('0.1809 ETH')
    })
  })

  describe('Use as a fiat currency', () => {
    beforeAll(() => {
      useUserStore.setState({ showBalances: true })
    })

    beforeEach(() => (object = Amount.fromDecimal('512.349828', 'GBP')))

    it('should be an amount', () => {
      expect(object).toBeInstanceOf(Amount)
    })

    it('should have properties', () => {
      expect(object.asBigNumber()).toBeInstanceOf(BigNumber)
      expect(object.currency).toBeInstanceOf(Currency)
    })

    it('should have correct values', () => {
      expect(object.asBigNumber().toString()).toEqual('512349828')
      expect(object.currency.symbol).toEqual('GBP')
      expect(object.fiatValue.toString()).toEqual('0')
    })

    it('displays a localised amount', () => {
      expect(object.localAmount()).toEqual('£512.34')
    })

    it('uses USD if no fiat currency is selected', () => {
      useUserStore.setState({ settings: {} })
      expect(object.asFiat()).toEqual(object.asUSD())
    })
  })

  describe('handle user fiat currency setting', () => {
    beforeEach(() => (object = new Amount(subunits, currency, usdValue)))
    beforeAll(() => {
      useCurrenciesStore.setState({ fiatRates: { GBP: 0.788352 } as Record<FiatRateCurrency, number> })
    })

    it('should be an amount', () => {
      expect(object).toBeInstanceOf(Amount)
    })

    it('returns value asUSD if user currency is undefined', () => {
      useUserStore.setState({ showBalances: true })

      expect(object.asFiat()).toEqual(object.asUSD())
    })

    it('returns value asUSD if user currency is USD', () => {
      useUserStore.setState({ showBalances: true, settings: { FIAT_CURRENCY: 'USD' } })

      expect(object.asFiat()).toEqual(object.asUSD())
    })

    it('does not allow H1 to have a fiat amount', () => {
      const amt = new Amount(subunits, 'H1', usdValue)
      expect(amt.asFiat()).toEqual('')
    })

    it('returns a string with valid currency symbol and currency conversion', () => {
      useUserStore.setState({ showBalances: true, settings: { FIAT_CURRENCY: 'GBP' } })

      expect(object.asFiat()).toEqual('£1,250.40')
    })

    it('returns a string with valid currency symbol and currency conversion', () => {
      useUserStore.setState({ showBalances: true, settings: { FIAT_CURRENCY: 'GBP' } })
      useCurrenciesStore.setState({ fiatRates: { GBP: 1 } as Record<FiatRateCurrency, number> })
      object = Amount.fromDecimal(subunits, currency, '5123')
      expect(object.asFiat(true)).toEqual('£5,123')
    })

    it('removes .00 if required from converted currency amount', () => {
      useUserStore.setState({ showBalances: true, settings: { FIAT_CURRENCY: 'GBP' } })
      useCurrenciesStore.setState({ fiatRates: { GBP: 1 } })
      object = new Amount(subunits, currency, '1586.00009685843')
      expect(object.asFiat(true)).toEqual('£1,586')
    })
  })

  describe('support a zero or negative balance', () => {
    beforeAll(() => {
      useUserStore.setState({ showBalances: true })
    })

    beforeEach(() => (object = Amount.fromDecimal('0', 'BTC')))

    it('should be an amount', () => {
      expect(object).toBeInstanceOf(Amount)
    })

    it('should return that it is zero', () => {
      expect(object.isZero()).toEqual(true)
    })

    it('should return zero strings', () => {
      expect(object.toString()).toEqual('0.0000 BTC')
    })

    it('should return whether it is a negative balance', () => {
      expect(object.isNegative()).toEqual(false)
      const amt = new Amount('-100', currency)
      expect(amt.isNegative()).toEqual(true)
    })

    it('should return whether it is a negative balance', () => {
      const amt = new Amount('0', currency)
      expect(amt.setUsdValueFromRate(1234).toString()).toEqual('0.0000 ETH')
    })
  })

  describe('trailing zero support', () => {
    beforeAll(() => {
      useUserStore.setState({ showBalances: true })
    })

    it('should return trailing zero strings', () => {
      object = Amount.fromDecimal('2', 'ETH')
      expect(object.toString()).toEqual('2.0000 ETH')
    })

    it('should return two trailing zeroes for stable coins', () => {
      object = Amount.fromDecimal('100', 'DAI')
      expect(object.toString()).toEqual('100.00 DAI')
    })

    it('should return two trailing zeroes for fiat currencies', () => {
      object = Amount.fromDecimal('100', 'EUR')
      expect(object.toString()).toEqual('€100.00')
    })
  })

  it('can convert directly from unit to subunit like parseUnit', () => {
    expect(Amount.decimalToSubunit(units, currency)).toEqual(subunits)
  })

  it('can convert directly from unit to subunit without triggering exponential syntax', () => {
    expect(Amount.decimalToSubunit('25000', 'DAI')).toEqual('25000000000000000000000')
  })

  it('can format by decimal currency', () => {
    object = Amount.fromDecimal('2', 'BTC')
    expect(object.asDecimalFormat()).toEqual('2.00000000 BTC')
  })

  it('can return state hide balance when showBalances is false', () => {
    useUserStore.setState({ showBalances: false })
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.asUSD()).toEqual('— —')
    expect(object.asFiat()).toEqual('— —')
    expect(object.localAmount()).toEqual('— —')
    expect(object.toString()).toEqual('— —')
    useUserStore.setState({ showBalances: true })
  })

  it('should support hide balance', () => {
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.shouldAlwaysShowBalances().alwaysShowBalances).toEqual(true)
  })

  it('should support hide balance value', () => {
    object = Amount.fromDecimal('2', 'ETH').shouldAlwaysShowBalances()
    expect(object.shouldShowBalance()).toEqual(true)
  })

  it('should allow checking if is currency', () => {
    expect(object.isCurrency('ETH')).toBe(true)
  })

  it('should support taking a fee percentage', () => {
    object = Amount.fromDecimal('2000', 'ETH')
    expect(object.takeFee(0.1).toString()).toEqual('200.0000 ETH')
  })

  it('should support the remainder of a fee percentage', () => {
    object = Amount.fromDecimal('2000', 'ETH')
    expect(object.takeFee(0.1, true).toString()).toEqual('1,800.0000 ETH')
  })

  it('should support setting to show balance', () => {
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.alwaysShowBalances).toBe(false)
    object.shouldAlwaysShowBalances()
    expect(object.alwaysShowBalances).toBe(true)
    expect(object.shouldShowBalance()).toBe(true)
  })

  it('should support multiplication', () => {
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.multipliedBy(2).toString()).toEqual('4.0000 ETH')
  })

  it('should support division', () => {
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.dividedBy(2).toString()).toEqual('1.0000 ETH')
  })

  it('can return state hide balance', () => {
    useUserStore.setState({ showBalances: true })
    object = Amount.fromDecimal('2', 'ETH')
    expect(object.shouldShowBalance()).toEqual(true)
  })

  it('should compare currencies', () => {
    expect(object.isCurrency('ETH')).toEqual(true)
  })

  describe('amount rounding and precision', () => {
    it('should truncate values for display instead of rounding', () => {
      object = Amount.fromDecimal('2649.01698', 'EUR')

      expect(object.toString()).toEqual('€2,649.01')

      // expect(new BigNumber('2649.01698').toFormat(2, BigNumber.ROUND_FLOOR)).toEqual('2,649.01')
    })
  })
})
