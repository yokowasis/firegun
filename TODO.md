✅ Cek Perbedaan Delete dengan Put Null dan Put Alamat Lain 
    ➡ Tidak ada perbedaan. null merupakan reference ke suatu alamat lain yang tidak ada.
    ➡ Child tetap ada dan bisa diakses menggunakan `/` operator. `/` tidak menghormati reference 
       Berbeda dengan operator `get`
✅ Notif ke node user ada chat yg dihapus
✅ BUG Yg dihapus kembali muncul ketika mengirim pesan baru

⬜ Test fungsi `Purge()`
⬜ Perbaiki fungsi `Del()` dan `userDel()` gunakan folder `orphanNode` dan `~orphanNode~`
⬜ Buat fungsi `Purge()` dan `userPurge()` me`null`kan node tersebut dan child nya. 
   Jangan buat recursive, karena gun bisa menggunakan circular reference. Akan menjadi infinite loop.
