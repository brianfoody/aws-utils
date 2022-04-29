export const expectEnv = <T extends string>(
  ...vars: T[]
): { [P in T]: string } => {
  for (let v of vars) {
    if (process.env[v] == null || process.env[v] == undefined) {
      throw new Error(`Missing expected environment variable '${v}'`);
    }
  }

  return vars.reduce(
    (accum, curr) => ({ ...accum, [curr]: process.env[curr] }),
    {}
  ) as any;
};
