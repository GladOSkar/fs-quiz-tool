FS Quiz Tool question format
============================

This document provides examples for the question format

The web tool will accept these in TSV format, as copied from a spreadsheet like Google Sheets. One Question is one row of the TSV, and each column is one of the following fields, like:

Input Type | Question | Choices/Answer Options  | Answers | Explanation | Author | Picture Link    | Time in minutes
-----------|----------|-------------------------|---------|-------------|--------|-----------------|----------------
ChooseOne  | ...      | a<br>b                  | 2       | ...         | ...    | https://url.jpg | 3
Text       | ...      | Answer in W, 2 decimals | 4.20    | ...         | ...    |                 | 5

## ChooseOne

Single-Choice question

##### Question Text

```text
How many drivers per team are allowed at most?
```

##### Answer options

```text
Unlimited, but the number of drivers per event is limited to two.
Unlimited, but the number of events per driver is limited to two.
Six.
```

##### Correct Answer(s)

```text
3
```

##### Explanation

```text
D 1.1.1: "[...] a maximum of six drivers are allowed for each team"
```

##### Author

```text
John Doe
```

##### Time [minutes]

```text
3
```

## ChooseAny

##### Question Text

```text
Due to rust and corrosion of the filler neck a new one need to be installed. choose one or more of the shown filler neck types(made of none clear material) that are allowed according to the FSG rules.
```

##### Answer options

```text
a
b
c
d
```

##### Correct Answer(s)

```text
2
4
```

##### Explanation

```text
CV 2.6
```

##### Author

```text
Jane Doe
```

##### Image Link

```text
https://i.ibb.co/m8C9VZp/image.png
```

##### Time [minutes]

```text
3
```

## Text

##### Question Text

```text
Calculate the torsional- and bending-nominal stress at the critical cross section for the load case shown below. Given: P = 12kW; n = 980 1/min; F = 500 N; xkrit = 110 mm; 0 ≤ x0 ≤ 120mm
```

##### Answer options

```text
Torsional-nominal stress [N/mm², 1 decimal]
Bending-nominal stress [N/mm², 1 decimal]
```

##### Correct Answer(s)

```text
17.1
18.2
```

##### Explanation

```text
https://i.ibb.co/1r3yqY7/2b.png
```

##### Author

```text
Max Mustermann
```

##### Image Link

```text
https://i.ibb.co/tYTdw86/2a.png
```

##### Time [minutes]

```text
7
```
