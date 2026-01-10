# Citation Manager Examples

## Example 1: APA Style - Journal Article

**Input**:
```json
{
  "title": "Attention Is All You Need",
  "authors": [{"first": "Ashish", "last": "Vaswani"}],
  "year": 2017,
  "venue": "NeurIPS"
}
```

**Output**:
```json
{
  "inText": "(Vaswani, 2017)",
  "bibliography": "Vaswani, A. (2017). Attention is all you need. NeurIPS.",
  "isValid": true
}
```

## Example 2: APA Style - Multiple Authors

**Input**:
```json
{
  "title": "Language Models are Few-Shot Learners",
  "authors": [
    {"first": "Tom", "last": "Brown"},
    {"first": "Benjamin", "last": "Mann"},
    {"first": "Ryder", "last": "Nickerson"}
  ],
  "year": 2020,
  "venue": "NeurIPS",
  "volume": "33",
  "pages": "1877-1901"
}
```

**Output**:
```json
{
  "inText": "(Brown et al., 2020)",
  "bibliography": "Brown, T., Mann, B., Nickerson, R., et al. (2020). Language models are few-shot learners. NeurIPS, 33, 1877-1901.",
  "isValid": true
}
```

## Example 3: MLA Style

**Input**:
```json
{
  "title": "Deep Learning",
  "authors": [{"first": "Ian", "last": "Goodfellow"}],
  "year": 2016,
  "venue": "MIT Press"
}
```

**Output**:
```json
{
  "inText": "(Goodfellow)",
  "bibliography": "Goodfellow, Ian. Deep Learning. MIT Press, 2016.",
  "isValid": true
}
```

## Example 4: IEEE Style

**Input**:
```json
{
  "title": "Gradient-Based Learning Applied to Document Recognition",
  "authors": [{"first": "Yann", "last": "LeCun"}],
  "year": 1998,
  "venue": "Proceedings of the IEEE",
  "volume": "86",
  "issue": "11",
  "pages": "2278-2324"
}
```

**Output**:
```json
{
  "inText": "[1]",
  "bibliography": "[1] Y. LeCun, \"Gradient-Based Learning Applied to Document Recognition,\" Proceedings of the IEEE, vol. 86, no. 11, pp. 2278-2324, 1998.",
  "isValid": true
}
```

## Example 5: With DOI

**Input**:
```json
{
  "title": "Deep Residual Learning for Image Recognition",
  "authors": [{"first": "Kaiming", "last": "He"}],
  "year": 2016,
  "venue": "CVPR",
  "doi": "10.1109/CVPR.2016.90"
}
```

**Output**:
```json
{
  "inText": "(He, 2016)",
  "bibliography": "He, K. (2016). Deep residual learning for image recognition. CVPR. https://doi.org/10.1109/CVPR.2016.90",
  "isValid": true
}
```
