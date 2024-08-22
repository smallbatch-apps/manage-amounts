import BigNumber from "bignumber.js";

// prevent bignumber converting to exponential notation
BigNumber.config({ EXPONENTIAL_AT: 1e9 });

type Currency = {
  symbol: string;
  decimals: number;
  name?: string;
};

export default class Amount {
  private amount: BigNumber;
  public currency: Currency;
  public fiatValue: BigNumber;
  private roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN;
  private displayDecimals = 4;

  constructor(amount: string, currency: Currency, fiatValue = "0") {
    this.amount = new BigNumber(amount);
    this.currency = currency;
    this.fiatValue = new BigNumber(fiatValue);
  }

  /**
   * Alters the default number of decimal places to display
   * this is useful for display purposes, and does not alter the underlying value
   * @example
   * ```typescript
   * const amount = new Amount("50030", { symbol: "USD", decimals: 2 });
   * amount.setDisplayDecimals(2).toString(); // "$500.30"
   * ```
   * @param decimals - Number of decimal places to display
   * @returns this - Returns the instance of the Amount class
   */
  setDisplayDecimals(decimals: number) {
    this.displayDecimals = decimals;
    return this;
  }

  /**
   * Alters the default rounding mode for the amount
   * this is useful for display purposes, and does not alter the underlying value
   * @example
   * ```typescript
   * const amount = new Amount("127298403429659153", { symbol: "ETH", decimals: 16 });
   * amount.setRoundingMode(BigNumber.ROUND_UP).toString(); // "12.730 ETH"
   * ```
   * @param mode - BigNumber.RoundingMode to use
   * @returns this - Returns the instance of the Amount class
   */
  setRoundingMode(mode: BigNumber.RoundingMode) {
    this.roundingMode = mode;
    return this;
  }

  /**
   * Convenience method to return internal BigNumber
   * @returns {BigNumber} - Returns the amount as a BigNumber
   */
  asBigNumber() {
    return this.amount;
  }

  /**
   * Convenience method to return internal BigNumber as JS BigInt
   * @returns {BigInt} - Returns the amount as a BigInt
   */
  asBigInt() {
    return BigInt(this.amount.toString());
  }

  /**
   * Returns the amount as a string, with decimal shifted correctly
   * this is mostly intended for use with form inputs, etc
   * @returns {string} - Returns the amount as a string
   */
  asValue() {
    return this.down().toString();
  }

  /**
   * Returns the amount as a string, without decimal shifted
   * this is often the value needed in a payload or request
   * @returns {string} - Returns the amount as a long string - eg Wei value
   */
  asSubunit() {
    return this.amount.toString();
  }

  asFiatFloat() {
    return parseFloat(
      this.fiatValue.toFormat(2, this.roundingMode, {
        groupSeparator: "",
        decimalSeparator: ".",
      })
    );
  }

  asDecimalFormat() {
    const value = this.down().toFormat(
      this.currency.decimals,
      this.roundingMode
    );
    return `${value} ${this.currency}`;
  }

  asUSD(decimals = 2, removeDecimals = false) {
    const amount = `$${this.fiatValue.toFormat(decimals, this.roundingMode)}`;
    if (removeDecimals) return amount.replace(".00", "");
    return amount;
  }

  asFiat(removeDecimals = false) {
    const userSettings = useUserStore.getState().settings;
    const currency = (userSettings["FIAT_CURRENCY"] as string) ?? "USD";

    if (currency === "USD") {
      return this.asUSD(2, removeDecimals);
    }

    const fiatRates = useCurrenciesStore.getState().fiatRates;
    const rate = fiatRates[currency as FiatRateCurrency];

    const value = this.fiatValue.multipliedBy(rate);

    const amount = formatCurrencyNarrow(currency, Number(value));
    if (removeDecimals) return amount.replace(".00", "");
    return amount;
  }

  /**
   * Determines if the amount is a non-zero value, intended primarily for
   * use in conditional statements or filters
   * @returns {boolean} - The amount is not zero - Note this does not support negative amounts
   */
  nonZero() {
    return this.amount.isGreaterThan(0);
  }

  /**
   * Determines if the amount is zero, intended primarily for
   * use in conditional statements or filters
   * @returns {boolean} - The amount is zero
   */
  isZero() {
    return this.amount.isZero();
  }

  localAmountFiat(value: string) {
    return this.formatCurrency(this.currency.symbol, Number(value));
  }

  localAmount(decimals = 4) {
    return this.down().toFormat(decimals, this.roundingMode);
  }

  integerLocalAmount(includeCurrency = false) {
    return (
      this.down().toFormat(0, this.roundingMode) +
      (includeCurrency ? " " + this.currency.symbol : "")
    );
  }

  /**
   *
   * @param currencyCode {string} - String to test as a currency code
   * @returns {boolean}
   */

  isValidCurrency(currencyCode: string): boolean {
    try {
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  fullLocalAmount() {
    const isFiat = this.isValidCurrency(this.currency.symbol);
    if (isFiat) {
      return this.localAmount().replace(".00", "");
    }
    const formattedAmount = this.down().toFormat();
    return `${formattedAmount} ${this.currency.symbol}`;
  }

  getLocale() {
    return "en-US";
  }

  formatCurrency(
    currency: string,
    value: number,
    opts: Intl.NumberFormatOptions = {}
  ) {
    return new Intl.NumberFormat(this.getLocale(), {
      style: "currency",
      currencyDisplay: "narrowSymbol", // Uses a narrow format symbol ("$100" rather than "US$100").
      currency,
      ...opts,
    }).format(value);
  }

  down() {
    return this.amount.shiftedBy(-this.currency.decimals);
  }

  isNegative() {
    return this.amount.isNegative();
  }

  toString() {
    return `${this.localAmount()}${
      this.currency.isFiat ? "" : " " + this.currency
    }`;
  }

  toFloat() {
    return this.down().toNumber();
  }

  equals(amount: Amount) {
    return (
      this.amount.isEqualTo(amount.amount) &&
      this.currency.symbol === amount.currency.symbol
    );
  }

  isLessThanValue(value: string) {
    return this.down().isLessThan(value);
  }

  isMoreThanValue(value: string) {
    return this.down().isGreaterThan(value);
  }

  isCurrency(currency: string) {
    return this.currency.symbol === currency;
  }

  setUsdValueFromRate(rate: number) {
    if (this.isZero()) return this;
    this.fiatValue = this.down().multipliedBy(rate);
    return this;
  }

  // percentage should be passed in as a decimal eg. 0.1 for 10%
  multiplyPercentage(percentage: number) {
    return this.amount
      .multipliedBy(percentage)
      .shiftedBy(-this.currency.decimals)
      .decimalPlaces(this.currency.decimals, this.roundingMode)
      .toString();
  }

  takeFee(fee: number, remainder = false) {
    if (remainder) fee = 1 - fee;
    return Amount.fromDecimal(this.multiplyPercentage(fee), this.currency);
  }

  multipliedBy(multiplier: number) {
    return new Amount(
      this.amount.multipliedBy(multiplier).toString(),
      this.currency,
      this.fiatValue.multipliedBy(multiplier).toString()
    );
  }

  dividedBy(divisor: number) {
    return new Amount(
      this.amount.dividedBy(divisor).toString(),
      this.currency,
      this.fiatValue.dividedBy(divisor).toString()
    );
  }

  mergeAmount(amount: Amount) {
    return new Amount(
      this.amount.plus(amount.amount).toString(),
      this.currency,
      this.fiatValue.plus(amount.fiatValue).toString()
    );
  }

  static fromDecimal(
    decimalString: string,
    currency: Currency,
    fiatValue = "0"
  ) {
    const bn = new BigNumber(decimalString).decimalPlaces(
      currency.decimals,
      BigNumber.ROUND_FLOOR
    );
    return new Amount(
      bn.shiftedBy(currency.decimals).toString(),
      currency,
      fiatValue
    );
  }

  /**
   * Creates a new instance from the current instance, to maintain settings such as rounding mode
   * or display decimals
   * @param amount -
   */
  amountFrom(amount: string, currency: Currency, fiatValue: string) {}
  amountFromDecimal() {}
}
