with open("data_publisher.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("YOUR_API_KEY_HERE", "2bd6cbae2cf7853fefd3acfde37d48e7")

with open("data_publisher.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated: data_publisher.py with real API key")
print("Done!")
