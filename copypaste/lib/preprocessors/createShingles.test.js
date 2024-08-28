const { createShingles } = require("./createShingles");

describe("createShingles", () => {
  it("should create a preprocessor that creates shingles from incoming tokens", async () => {
    const pp = createShingles();

    expect(await pp(["this", "is", "a", "test", "sentence"], {})).toStrictEqual([
      "this_is_a_s3",
      "is_a_test_s3",
      "a_test_sentence_s3",
      "this_is_a_test_sentence_s5",
    ]);
  });
});
