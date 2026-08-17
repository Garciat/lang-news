// deno-lint-ignore-file no-namespace

export namespace Intern {
  export namespace PlainYearMonth {
    const cache = new Map<string, Temporal.PlainYearMonth>();

    export function from(
      obj: Temporal.PlainYearMonth,
    ): Temporal.PlainYearMonth {
      return cache.getOrInsertComputed(
        obj.toString(),
        (key) => Temporal.PlainYearMonth.from(key),
      );
    }
  }
}
