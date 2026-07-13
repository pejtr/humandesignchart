import sys

with open('client/src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
'''              </div>
            </nav>''',
'''              </div>
            </div>
          </nav>''')

with open('client/src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Done fixing Navbar phase 2!")
