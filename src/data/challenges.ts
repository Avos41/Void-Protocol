import type { Challenge } from "../types/game";

export const CHALLENGES: Challenge[] = [
  // ── Algorithms ──────────────────────────────────────
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    category: "algorithms",
    difficulty: "easy",
    description:
      'Write a function that returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for both, or the number as a string.',
    starterCode: `def fizzbuzz(n):
    # TODO: Return "Fizz", "Buzz", "FizzBuzz", or str(n)
    if n % 15 == 0:
        return "FizzBuzz"
    elif n % 3 == 0:
        return "Fizz"
    elif n % 5 == 0:
        return "Buzz"
    else:
        return str(n)`,
    testCases: [
      { input: "1", expectedOutput: '"1"', label: "fizzbuzz(1) → '1'" },
      { input: "3", expectedOutput: '"Fizz"', label: "fizzbuzz(3) → 'Fizz'" },
      { input: "5", expectedOutput: '"Buzz"', label: "fizzbuzz(5) → 'Buzz'" },
      { input: "15", expectedOutput: '"FizzBuzz"', label: "fizzbuzz(15) → 'FizzBuzz'" },
      { input: "7", expectedOutput: '"7"', label: "fizzbuzz(7) → '7'" },
    ],
    sabotageTargets: ["line 3: change % 15 to % 10", "line 5: change % 3 to % 4", "line 7: change % 5 to % 6"],
    sabotageTasks: [
      { id: "fizz-mod", description: "Change the modulo operator on the Fizz check", hint: "Make % 3 into % 4 — it'll break on multiples of 3", targetLine: 5 },
      { id: "fizzbuzz-mod", description: "Break the FizzBuzz condition", hint: "Change % 15 to % 10 — subtle but deadly", targetLine: 3 },
    ],
  },
  {
    id: "count-vowels",
    title: "Count Vowels",
    category: "algorithms",
    difficulty: "easy",
    description:
      "Write a function that counts the number of vowels (a, e, i, o, u) in a string, case-insensitive.",
    starterCode: `def count_vowels(s):
    # TODO: Count vowels in the string
    count = 0
    for char in s:
        if char.lower() in 'aeiou':
            count += 1
    return count`,
    testCases: [
      { input: '"hello world"', expectedOutput: "3", label: 'count_vowels("hello world") → 3' },
      { input: '"AEIOU"', expectedOutput: "5", label: 'count_vowels("AEIOU") → 5' },
      { input: '"rhythm"', expectedOutput: "0", label: 'count_vowels("rhythm") → 0' },
      { input: '"Programming"', expectedOutput: "3", label: 'count_vowels("Programming") → 3' },
    ],
    sabotageTargets: ["line 5: remove a vowel from 'aeiou'", "line 6: change += 1 to += 0", "line 3: start count at 1"],
    sabotageTasks: [
      { id: "vowel-set", description: "Remove a vowel from the check set", hint: "Drop 'u' from 'aeiou' — few people notice", targetLine: 5 },
      { id: "vowel-count", description: "Break the counter increment", hint: "Change += 1 to += 0 — looks right, counts nothing", targetLine: 6 },
    ],
  },
  {
    id: "binary-search",
    title: "Fix Binary Search",
    category: "algorithms",
    difficulty: "medium",
    description:
      "The binary search function has 3 bugs. Fix them all so it correctly finds the target index or returns -1.",
    starterCode: `def binary_search(arr, target):
    # TODO: Fix the 3 bugs in this binary search
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    testCases: [
      { input: "[1,2,3,4,5], 3", expectedOutput: "2", label: "binary_search([1,2,3,4,5], 3) → 2" },
      { input: "[1,2,3,4,5], 6", expectedOutput: "-1", label: "binary_search([1,2,3,4,5], 6) → -1" },
      { input: "[1,3,5,7,9], 7", expectedOutput: "3", label: "binary_search([1,3,5,7,9], 7) → 3" },
      { input: "[2,4,6], 6", expectedOutput: "2", label: "binary_search([2,4,6], 6) → 2" },
      { input: "[10], 10", expectedOutput: "0", label: "binary_search([10], 10) → 0" },
    ],
    sabotageTargets: ["line 3: change len(arr) - 1 to len(arr)", "line 5: change // 2 to / 2", "line 9: change mid + 1 to mid"],
    sabotageTasks: [
      { id: "bs-bound", description: "Introduce an off-by-one in the boundary", hint: "Change len(arr) - 1 to len(arr) — causes index error on edge cases", targetLine: 3 },
      { id: "bs-div", description: "Break the midpoint calculation", hint: "Change // 2 to / 2 — float division instead of integer", targetLine: 5 },
      { id: "bs-advance", description: "Prevent the left pointer from advancing", hint: "Change mid + 1 to mid — creates infinite loop", targetLine: 9 },
    ],
  },
  {
    id: "sorting-bubble",
    title: "Bubble Sort",
    category: "algorithms",
    difficulty: "medium",
    description:
      "Implement bubble sort to sort a list of numbers in ascending order. Return the sorted list.",
    starterCode: `def bubble_sort(arr):
    # TODO: Implement bubble sort
    n = len(arr)
    result = arr.copy()
    for i in range(n):
        for j in range(0, n - i - 1):
            if result[j] > result[j + 1]:
                result[j], result[j + 1] = result[j + 1], result[j]
    return result`,
    testCases: [
      { input: "[5, 3, 8, 1, 2]", expectedOutput: "[1, 2, 3, 5, 8]", label: "bubble_sort([5,3,8,1,2]) → [1,2,3,5,8]" },
      { input: "[1]", expectedOutput: "[1]", label: "bubble_sort([1]) → [1]" },
      { input: "[3, 1]", expectedOutput: "[1, 3]", label: "bubble_sort([3,1]) → [1,3]" },
      { input: "[1, 2, 3]", expectedOutput: "[1, 2, 3]", label: "bubble_sort([1,2,3]) → [1,2,3]" },
    ],
    sabotageTargets: ["line 7: change > to <", "line 6: change n - i - 1 to n - i", "line 8: swap the swap order"],
    sabotageTasks: [
      { id: "bubble-cmp", description: "Flip the comparison operator", hint: "Change > to < — sorts in reverse", targetLine: 7 },
      { id: "bubble-range", description: "Cause an index out of range error", hint: "Change n - i - 1 to n - i — off-by-one overflow", targetLine: 6 },
    ],
  },
  {
    id: "two-pointer",
    title: "Two Pointer — Pair Sum",
    category: "algorithms",
    difficulty: "hard",
    description:
      "Given a SORTED list, find two numbers that add up to the target. Return them as a list [a, b]. If no pair exists, return an empty list.",
    starterCode: `def pair_sum(arr, target):
    # TODO: Use two pointers on sorted array
    left, right = 0, len(arr) - 1
    while left < right:
        total = arr[left] + arr[right]
        if total == target:
            return [arr[left], arr[right]]
        elif total < target:
            left += 1
        else:
            right -= 1
    return []`,
    testCases: [
      { input: "[1, 2, 3, 4, 5], 7", expectedOutput: "[2, 5]", label: "pair_sum([1,2,3,4,5], 7) → [2,5]" },
      { input: "[1, 3, 5, 7], 10", expectedOutput: "[3, 7]", label: "pair_sum([1,3,5,7], 10) → [3,7]" },
      { input: "[1, 2, 3], 10", expectedOutput: "[]", label: "pair_sum([1,2,3], 10) → []" },
      { input: "[1, 5], 6", expectedOutput: "[1, 5]", label: "pair_sum([1,5], 6) → [1,5]" },
    ],
    sabotageTargets: ["line 4: change < to <=", "line 9: change += 1 to -= 1", "line 11: change -= 1 to += 1"],
    sabotageTasks: [
      { id: "tp-loop", description: "Create an infinite loop condition", hint: "Change < to <= — pointers never stop", targetLine: 4 },
      { id: "tp-direction", description: "Reverse a pointer direction", hint: "Change left += 1 to left -= 1 — goes the wrong way", targetLine: 9 },
    ],
  },

  // ── String Manipulation ─────────────────────────────
  {
    id: "reverse-string",
    title: "Reverse String",
    category: "string-manipulation",
    difficulty: "easy",
    description:
      "Write a function that reverses a string without using the built-in reverse or [::-1].",
    starterCode: `def reverse_string(s):
    # TODO: Reverse the string manually
    result = ""
    for char in s:
        result = char + result
    return result`,
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', label: 'reverse_string("hello") → "olleh"' },
      { input: '"ab"', expectedOutput: '"ba"', label: 'reverse_string("ab") → "ba"' },
      { input: '""', expectedOutput: '""', label: 'reverse_string("") → ""' },
      { input: '"a"', expectedOutput: '"a"', label: 'reverse_string("a") → "a"' },
    ],
    sabotageTargets: ["line 5: change char + result to result + char", "line 3: start with a non-empty string"],
    sabotageTasks: [
      { id: "rev-order", description: "Swap the concatenation order", hint: "Change char + result to result + char — returns original string", targetLine: 5 },
      { id: "rev-init", description: "Corrupt the initial value", hint: "Start result as a space instead of empty — adds invisible prefix", targetLine: 3 },
    ],
  },
  {
    id: "palindrome-check",
    title: "Palindrome Check",
    category: "string-manipulation",
    difficulty: "easy",
    description:
      "Write a function that returns True if a string is a palindrome (ignoring case and non-alphanumeric characters).",
    starterCode: `def is_palindrome(s):
    # TODO: Check if string is a palindrome
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]`,
    testCases: [
      { input: '"racecar"', expectedOutput: "True", label: 'is_palindrome("racecar") → True' },
      { input: '"A man a plan a canal Panama"', expectedOutput: "True", label: 'is_palindrome("A man a plan...") → True' },
      { input: '"hello"', expectedOutput: "False", label: 'is_palindrome("hello") → False' },
      { input: '"Was it a car or a cat I saw"', expectedOutput: "True", label: 'is_palindrome("Was it a car...") → True' },
    ],
    sabotageTargets: ["line 3: remove .lower()", "line 3: change isalnum to isalpha", "line 4: change [::-1] to [::1]"],
    sabotageTasks: [
      { id: "pal-case", description: "Break case-insensitive comparison", hint: "Remove .lower() — 'Racecar' will fail", targetLine: 3 },
      { id: "pal-slice", description: "Break the reversal slice", hint: "Change [::-1] to [::1] — compares string to itself", targetLine: 4 },
    ],
  },
  {
    id: "anagram-check",
    title: "Anagram Checker",
    category: "string-manipulation",
    difficulty: "medium",
    description:
      "Write a function that checks if two strings are anagrams of each other (ignoring case and spaces).",
    starterCode: `def is_anagram(s1, s2):
    # TODO: Check if s1 and s2 are anagrams
    clean1 = s1.replace(' ', '').lower()
    clean2 = s2.replace(' ', '').lower()
    return sorted(clean1) == sorted(clean2)`,
    testCases: [
      { input: '"listen", "silent"', expectedOutput: "True", label: 'is_anagram("listen","silent") → True' },
      { input: '"hello", "world"', expectedOutput: "False", label: 'is_anagram("hello","world") → False' },
      { input: '"Astronomer", "Moon starer"', expectedOutput: "True", label: 'is_anagram("Astronomer","Moon starer") → True' },
      { input: '"abc", "abcd"', expectedOutput: "False", label: 'is_anagram("abc","abcd") → False' },
    ],
    sabotageTargets: ["line 3: remove .lower()", "line 5: change == to !="],
    sabotageTasks: [
      { id: "ana-case", description: "Break case handling on one string", hint: "Remove .lower() from clean1 only — breaks mixed-case anagrams", targetLine: 3 },
      { id: "ana-cmp", description: "Invert the final comparison", hint: "Change == to != — returns True when NOT anagram", targetLine: 5 },
    ],
  },

  // ── Data Structures ─────────────────────────────────
  {
    id: "two-sum",
    title: "Two Sum",
    category: "data-structures",
    difficulty: "medium",
    description:
      "Given a list of numbers and a target, return the indices of two numbers that add up to the target.",
    starterCode: `def two_sum(nums, target):
    # TODO: Find two indices that add to target
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0, 1]", label: "two_sum([2,7,11,15], 9) → [0,1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1, 2]", label: "two_sum([3,2,4], 6) → [1,2]" },
      { input: "[1,5,3,7], 8", expectedOutput: "[1, 2]", label: "two_sum([1,5,3,7], 8) → [1,2]" },
    ],
    sabotageTargets: ["line 5: change target - num to target + num", "line 7: swap the return order", "line 8: change seen[num] to seen[i]"],
    sabotageTasks: [
      { id: "ts-complement", description: "Break the complement calculation", hint: "Change target - num to target + num — completely wrong logic", targetLine: 5 },
      { id: "ts-store", description: "Store the wrong key in the hashmap", hint: "Change seen[num] = i to seen[i] = num — lookup breaks", targetLine: 8 },
    ],
  },
  {
    id: "flatten-list",
    title: "Flatten Nested List",
    category: "data-structures",
    difficulty: "medium",
    description:
      "Write a function that flattens a nested list into a single flat list.",
    starterCode: `def flatten(lst):
    # TODO: Flatten nested lists recursively
    result = []
    for item in lst:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result`,
    testCases: [
      { input: "[[1, 2], [3, [4, 5]], 6]", expectedOutput: "[1, 2, 3, 4, 5, 6]", label: "flatten([[1,2],[3,[4,5]],6]) → [1,2,3,4,5,6]" },
      { input: "[1, [2, [3, [4]]]]", expectedOutput: "[1, 2, 3, 4]", label: "flatten([1,[2,[3,[4]]]]) → [1,2,3,4]" },
      { input: "[1, 2, 3]", expectedOutput: "[1, 2, 3]", label: "flatten([1,2,3]) → [1,2,3]" },
    ],
    sabotageTargets: ["line 6: change extend to append", "line 5: change isinstance check to type()"],
    sabotageTasks: [
      { id: "flat-extend", description: "Use the wrong list method", hint: "Change extend to append — creates nested sublists", targetLine: 6 },
      { id: "flat-check", description: "Break the type check", hint: "Change isinstance(item, list) to type(item) == list — breaks subclasses", targetLine: 5 },
    ],
  },
  {
    id: "stack-min",
    title: "Min Stack",
    category: "data-structures",
    difficulty: "hard",
    description:
      "Implement a MinStack class with push, pop, top, and get_min methods. get_min must be O(1).",
    starterCode: `class MinStack:
    def __init__(self):
        # TODO: Initialize the stack
        self.stack = []
        self.min_stack = []

    def push(self, val):
        self.stack.append(val)
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)

    def pop(self):
        val = self.stack.pop()
        if val == self.min_stack[-1]:
            self.min_stack.pop()

    def top(self):
        return self.stack[-1]

    def get_min(self):
        return self.min_stack[-1]`,
    testCases: [
      {
        input: "push(3), push(1), push(2), get_min()",
        expectedOutput: "1",
        label: "push 3,1,2 → get_min() → 1",
      },
      {
        input: "push(3), push(1), pop(), get_min()",
        expectedOutput: "3",
        label: "push 3,1, pop → get_min() → 3",
      },
    ],
    sabotageTargets: ["line 9: change <= to <", "line 14: remove the min_stack pop"],
    sabotageTasks: [
      { id: "ms-cmp", description: "Break the min-stack push condition", hint: "Change <= to < — duplicates won't get tracked", targetLine: 9 },
      { id: "ms-pop", description: "Prevent min tracking on pop", hint: "Remove the min_stack.pop() — stale minimums", targetLine: 14 },
    ],
  },

  // ── OOP Basics ──────────────────────────────────────
  {
    id: "animal-speak",
    title: "Animal Speak",
    category: "oop-basics",
    difficulty: "easy",
    description:
      'Create an Animal base class with a speak() method. Dog returns "Woof", Cat returns "Meow". Each also has a name property.',
    starterCode: `class Animal:
    def __init__(self, name):
        # TODO: Store the name
        self.name = name

    def speak(self):
        raise NotImplementedError

class Dog(Animal):
    def speak(self):
        return "Woof"

class Cat(Animal):
    def speak(self):
        return "Meow"`,
    testCases: [
      { input: 'Dog("Rex").speak()', expectedOutput: '"Woof"', label: 'Dog("Rex").speak() → "Woof"' },
      { input: 'Cat("Mimi").speak()', expectedOutput: '"Meow"', label: 'Cat("Mimi").speak() → "Meow"' },
      { input: 'Dog("Rex").name', expectedOutput: '"Rex"', label: 'Dog("Rex").name → "Rex"' },
    ],
    sabotageTargets: ["line 11: change 'Woof' to 'Bark'", "line 4: change self.name to self._name"],
    sabotageTasks: [
      { id: "animal-return", description: "Change a return value subtly", hint: "Change 'Woof' to 'Bark' — sounds right but fails tests", targetLine: 11 },
      { id: "animal-attr", description: "Break the name attribute", hint: "Change self.name to self._name — .name lookup fails", targetLine: 4 },
    ],
  },
  {
    id: "shape-area",
    title: "Shape Area — Inheritance",
    category: "oop-basics",
    difficulty: "medium",
    description:
      "Create a Shape base class, then Rectangle and Circle subclasses. Each must implement an area() method. Use math.pi for circle area.",
    starterCode: `import math

class Shape:
    def area(self):
        raise NotImplementedError

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2`,
    testCases: [
      { input: "Rectangle(3, 4).area()", expectedOutput: "12", label: "Rectangle(3,4).area() → 12" },
      { input: "Rectangle(5, 5).area()", expectedOutput: "25", label: "Rectangle(5,5).area() → 25" },
      { input: "round(Circle(1).area(), 5)", expectedOutput: "3.14159", label: "Circle(1).area() → 3.14159" },
      { input: "round(Circle(3).area(), 4)", expectedOutput: "28.2743", label: "Circle(3).area() → 28.2743" },
    ],
    sabotageTargets: ["line 13: change * to +", "line 20: change ** 2 to * 2", "line 20: remove math.pi"],
    sabotageTasks: [
      { id: "shape-op", description: "Change the Rectangle area operator", hint: "Change * to + — adds instead of multiplies", targetLine: 13 },
      { id: "shape-pow", description: "Break the Circle area formula", hint: "Change ** 2 to * 2 — squares vs doubles", targetLine: 20 },
    ],
  },
];
