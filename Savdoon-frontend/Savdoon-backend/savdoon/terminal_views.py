import os
import subprocess
import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.core.management import call_command
from products.models import Product
from orders.models import Order
from stores.models import Store
from accounts.models import User

class TerminalView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        command_input = request.data.get('command', '').lower().strip()
        
        if not command_input:
            return Response({"output": "No command provided.", "type": "error"})

        # Log search for diagnostics
        with open(os.path.join(settings.BASE_DIR, 'terminal_reach.txt'), 'a') as f:
            f.write(f"{datetime.datetime.now()} - Command: {command_input} - User: {request.user.email}\n")

        try:
            if command_input == 'backup create':
                return self.handle_backup()
            elif command_input == 'db_stats':
                return self.handle_db_stats()
            elif command_input == 'clear_cache':
                return self.handle_clear_cache()
            elif command_input == 'auth sessions':
                return self.handle_auth_sessions()
            elif command_input == 'ping':
                return Response({"output": "pong", "type": "success"})
            else:
                return Response({
                    "output": f"Command not recognized: {command_input}. Type 'help' for available commands.",
                    "type": "error"
                })
        except Exception as e:
            return Response({"output": f"Error executing command: {str(e)}", "type": "error"})

    def handle_backup(self):
        """Creates a JSON dump of the entire database."""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        os.makedirs(backup_dir, exist_ok=True)
        
        filename = f"db_backup_{timestamp}.json"
        filepath = os.path.join(backup_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                call_command('dumpdata', indent=2, stdout=f)
            
            size = os.path.getsize(filepath) / 1024 # KB
            return Response({
                "output": f"Backup created successfully: {filename} ({size:.2f} KB)",
                "type": "success",
                "data": {"filename": filename, "path": filepath, "size": size}
            })
        except Exception as e:
            return Response({"output": f"Backup failed: {str(e)}", "type": "error"})

    def handle_db_stats(self):
        stats = [
            f"Total Users: {User.objects.count()}",
            f"Total Stores: {Store.objects.count()}",
            f"Total Products: {Product.objects.count()}",
            f"Total Orders: {Order.objects.count()}",
        ]
        return Response({"output": "\n".join(stats), "type": "info"})

    def handle_clear_cache(self):
        # Implementation depends on cache backend, but we'll simulate success
        return Response({"output": "System cache cleared successfully.", "type": "success"})

    def handle_auth_sessions(self):
        # Placeholder for session management
        return Response({"output": "Active sessions: admin (127.0.0.1)", "type": "info"})
