$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('D:\Downloads\Stardust_Final_Production_Report.docx')
$doc.Content.Text | Out-File -FilePath 'D:\Downloads\antigravityfiles\stardust files\report_text.txt' -Encoding UTF8
$doc.Close()
$word.Quit()
