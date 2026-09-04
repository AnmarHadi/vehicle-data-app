Dim fso, dbPath, dataPath
Set fso = CreateObject("Scripting.FileSystemObject")

dbPath = fso.GetAbsolutePathName(WScript.Arguments(0))
dataPath = fso.GetAbsolutePathName(WScript.Arguments(1))

Dim accApp, db
Set accApp = CreateObject("Access.Application")
accApp.Visible = False

Set db = accApp.DBEngine.OpenDatabase(dbPath)

On Error Resume Next
db.Execute "DELETE FROM informatio", 128
If Err.Number <> 0 Then
    WScript.Echo "DELETE_ERROR|" & Err.Number & "|" & Err.Description
End If
On Error GoTo 0

' قراءة UTF-8
Dim stream
Set stream = CreateObject("ADODB.Stream")
stream.Type = 2
stream.Charset = "UTF-8"
stream.Open
stream.LoadFromFile dataPath
Dim content
content = stream.ReadText
stream.Close
Set stream = Nothing

content = Replace(content, vbCrLf, vbLf)
content = Replace(content, vbCr, vbLf)
Dim lines
lines = Split(content, vbLf)

Dim line, fields, sql, dateValue, goveValue, vhCovValue
Dim countInserted
countInserted = 0

For i = 1 To UBound(lines)
    line = lines(i)
    If Len(Trim(line)) > 0 Then
        fields = Split(line, "|")
        If UBound(fields) >= 14 Then
            
            ' التاريخ كنص
            dateValue = "NULL"
            If Len(Trim(fields(6))) > 0 Then
                dateValue = "'" & Replace(fields(6), "'", "''") & "'"
            End If
            
            ' dr_gove كرقم
            goveValue = "NULL"
            If Len(Trim(fields(7))) > 0 Then
                If IsNumeric(fields(7)) Then
                    goveValue = fields(7)
                End If
            End If
            
            ' vh_cov كرقم
            vhCovValue = "NULL"
            If Len(Trim(fields(12))) > 0 Then
                If IsNumeric(fields(12)) Then
                    vhCovValue = fields(12)
                End If
            End If
            
            sql = "INSERT INTO informatio (dr_na, dr_fa, dr_gr, dr_f_g, dr_alk, date_ph, dr_gove, dr_m_m, dr_n_h, dr_ner, vehicle_no, vh_cov, vehicle_type, vehicle_owner) VALUES ('" & _
                  Replace(fields(0), "'", "''") & "', '" & _
                  Replace(fields(1), "'", "''") & "', '" & _
                  Replace(fields(2), "'", "''") & "', '" & _
                  Replace(fields(3), "'", "''") & "', '" & _
                  Replace(fields(4), "'", "''") & "', " & _
                  dateValue & ", " & _
                  goveValue & ", '" & _
                  Replace(fields(8), "'", "''") & "', '" & _
                  Replace(fields(9), "'", "''") & "', '" & _
                  Replace(fields(10), "'", "''") & "', '" & _
                  Replace(fields(11), "'", "''") & "', " & _
                  vhCovValue & ", '" & _
                  Replace(fields(13), "'", "''") & "', '" & _
                  Replace(fields(14), "'", "''") & "')"
            
            On Error Resume Next
            db.Execute sql, 128
            If Err.Number = 0 Then
                countInserted = countInserted + 1
            Else
                WScript.Echo "ROW_ERROR|" & Err.Number & "|" & Err.Description
            End If
            On Error GoTo 0
        End If
    End If
Next

db.Close
Set db = Nothing
Set accApp = Nothing
Set fso = Nothing

WScript.Echo "SUCCESS|" & countInserted