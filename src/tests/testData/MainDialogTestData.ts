
 module.exports = [
     {
         expectedResult: "ddd",
         initialData: null,
         name: "tomorrow",
         steps: [
             ["hi", "On what date would you like to travel?"],
             ["tomorrow", null]
         ]
     },
     {
         expectedResult: "ddd",
         initialData: null,
         name: "the day after tomorrow",
         steps: [
             ["hi", "On what date would you like to travel?"],
             ["the day after tomorrow", null]
         ]
     },
     {
         expectedResult: "ddd",
         initialData: null,
         name: "two days from now",
         steps: [
             ["hi", "On what date would you like to travel?"],
             ["two days from now", null]
         ]
     },
     {
         expectedResult: "ddd",
         initialData: { date: "ddd" },
         name: "valid input given (tomorrow)",
         steps: [
             ["hi", null]
         ]
     },
     {
         expectedResult: "ddd",
         initialData: {},
         name: "retry prompt",
         steps: [
             ["hi", "On what date would you like to travel?"],
             ["bananas", "I'm sorry, for best results, please enter your travel date including the month, day and year."],
             ["tomorrow", null]
         ]
     },
     {
         expectedResult: "2055-05-05",
         initialData: {},
         name: "fuzzy time",
         steps: [
             ["hi", "On what date would you like to travel?"],
             ["may 5th", "I'm sorry, for best results, please enter your travel date including the month, day and year."],
             ["may 5th 2055", null]
         ]
     }
 ];